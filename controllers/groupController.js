const group = require("../models/group");
const message = require("../models/message");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");
const axios = require("axios");

module.exports = {
    findGroupPrivate,
    addGroupPrivate,
    getGroupID,
    getAllGroupOfUser,
    addGroup,
    addMembers,
    deleteMember,
    passKey,
    deleteGroup,
    editAvtNameGroup,
    notiCallVideo,// noti call video
}
//
async function addGroupPrivate(user1, user2) {
    try {
        const members = [user1, user2]
        const newItem = {
            members,
            isPrivate: true,
        };
        const newGroupPrivate = await group.create(newItem);
        //console.log(newGroup);
        return newGroupPrivate;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function addGroup(name, members) {
    try {

        if (!members || members.length === 0) {
            console.log("Danh sách thành viên trống!");
            return false;
        }

        const creator = members[0]; // Người tạo nhóm (không nhận thông báo)
        const otherMembers = members.slice(1); // Loại bỏ creator khỏi danh sách gửi thông báo

        const newItem = {
            name: name,
            members: members,// Vẫn thêm tất cả vào nhóm
            isPrivate: false,
        };

        // 🔥 Tạo nhóm và populate members
        let newGroup = await group.create(newItem);
        newGroup = await newGroup.populate('members', 'first_name last_name avatar');

        // Nếu không có thành viên nào khác để gửi thông báo, dừng lại
        if (otherMembers.length === 0) return newGroup;

        // 🔍 Tìm FCM tokens kèm `ID_user`
        const fcmTokens = await noti_token.find({ ID_user: { $in: otherMembers } }).select('ID_user tokens');

        // 🛠 Tạo thông báo cho từng thành viên (trừ creator)
        const notifications = fcmTokens.map(({ ID_user }) => ({
            ID_group: newGroup._id,
            ID_user: ID_user.toString(),
            type: 'Bạn đã được mời vào nhóm mới',
        }));

        // 💾 Lưu thông báo vào database
        const createdNotifications = await notification.insertMany(notifications);

        // 🎯 Ghép `token` với `notificationId`
        const notificationMap = createdNotifications.reduce((acc, noti) => {
            acc[noti.ID_user.toString()] = noti._id.toString();
            return acc;
        }, {});

        // 🔥 Tạo danh sách gửi thông báo từng người (trừ creator)
        // const messages = fcmTokens
        //     .map(({ ID_user, token }) => ({
        //         token,
        //         notificationId: notificationMap[ID_user.toString()],
        //     }))
        //     .filter(({ token }) => token && token.trim().length > 0); // Lọc token hợp lệ

        const messages = [];
        fcmData.forEach(({ ID_user, tokens }) => {
            if (tokens && tokens.length > 0) {
                tokens.forEach(token => {
                    messages.push({
                        token,
                        notificationId: notificationMap[ID_user.toString()],
                    });
                });
            }
        });

        if (messages.length === 0) return newGroup; // ⛔ Không có dữ liệu hợp lệ

        // 🚀 Gửi từng thông báo riêng lẻ
        await Promise.all(messages.map(({ token, notificationId }) =>
            axios.post(
                //`http://localhost:3001/gg/send-notification`,
                `https://linkage.id.vn/gg/send-notification`,
                {
                    fcmTokens: [token], // Chỉ gửi cho 1 user
                    title: "Thông báo",
                    body: null,
                    ID_noties: [notificationId], // Notification tương ứng
                })
        ));

        //console.log(newGroup);
        return newGroup;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function getGroupID(ID_group) {
    try {
        const result = await group.findById(ID_group)
            .populate('members', 'first_name last_name avatar');
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}


//
async function findGroupPrivate(user1, user2) {
    try {
        // Tìm nhóm riêng chứa cả 2 user
        const result = await group.findOne({
            members: { $all: [user1, user2] },
            isPrivate: true
        });
        // null là ko tìm thấy
        if (result != null) {
            return result._id;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

//
async function getAllGroupOfUser(ID_user) {
    try {
        // Tìm các nhóm mà user tham gia
        const groups = await group.find({
            $and: [
                { members: ID_user },
                { _destroy: false }
            ]
        })
            .populate('members', 'first_name last_name avatar')
            .lean() // Lấy kết quả dưới dạng object JavaScript để dễ thao tác
            .exec();

        // Lấy tin nhắn mới nhất của từng nhóm bằng Promise.all()
        const updatedGroups = await Promise.all(groups.map(async (group) => {
            const messageNew = await message.find({ ID_group: group._id })
                .populate('sender', 'first_name last_name avatar')
                .sort({ createdAt: -1 }) // Lấy tin nhắn mới nhất
                .limit(1);

            if (messageNew.length > 0) {
                group.messageLatest = {
                    ID_message: messageNew[0]._id,
                    sender: {
                        ID_user: messageNew[0].sender._id,
                        first_name: messageNew[0].sender.first_name,
                        last_name: messageNew[0].sender.last_name,
                        avatar: messageNew[0].sender.avatar,
                    },
                    content: messageNew[0].content,
                    createdAt: messageNew[0].createdAt,
                    _destroy: messageNew[0]._destroy,
                };
            } else {
                group.messageLatest = null;
            }
            return group;
        }));

        // Lọc nhóm không cần thiết
        const filteredGroups = updatedGroups.filter(group => group && (group.messageLatest != null || group.isPrivate == false));

        // 🔥 Sắp xếp nhóm theo thời gian tin nhắn mới nhất hoặc createdAt của group
        filteredGroups.sort((a, b) => {
            const timeA = a.messageLatest ? new Date(a.messageLatest.createdAt).getTime() : new Date(a.createdAt).getTime();
            const timeB = b.messageLatest ? new Date(b.messageLatest.createdAt).getTime() : new Date(b.createdAt).getTime();
            return timeB - timeA; // Sắp xếp giảm dần (mới nhất lên trên)
        });

        return filteredGroups;
    } catch (error) {
        console.error("Lỗi khi lấy nhóm:", error);
        throw error;
    }
}


// edit 
async function addMembers(ID_group, new_members) {
    try {
        const editGroup = await group.findById(ID_group);
        if (!editGroup) return false; // Nhóm không tồn tại

        // Lọc ra những thành viên chưa có trong nhóm
        const membersToAdd = new_members.filter(member => !editGroup.members.includes(member));

        if (membersToAdd.length === 0) return false; // Không có ai để thêm

        // Cập nhật danh sách thành viên
        editGroup.members = [...editGroup.members, ...membersToAdd];
        await editGroup.save();

        // 🔍 Tìm FCM tokens của những người được thêm vào nhóm
        const fcmTokens = await noti_token.find({ ID_user: { $in: membersToAdd } }).select('ID_user tokens');

        // 🛠 Tạo thông báo cho từng thành viên được thêm
        const notifications = fcmTokens.map(({ ID_user }) => ({
            ID_group: ID_group,
            ID_user: ID_user.toString(),
            type: 'Bạn đã được mời vào nhóm mới',
        }));

        // 💾 Lưu thông báo vào database
        const createdNotifications = await notification.insertMany(notifications);

        // 🎯 Ghép `token` với `notificationId`
        const notificationMap = createdNotifications.reduce((acc, noti) => {
            acc[noti.ID_user.toString()] = noti._id.toString();
            return acc;
        }, {});

        // 🔥 Tạo danh sách gửi thông báo từng người
        // const messages = fcmTokens
        //     .map(({ ID_user, token }) => ({
        //         token,
        //         notificationId: notificationMap[ID_user.toString()],
        //     }))
        //     .filter(({ token }) => token && token.trim().length > 0); // Lọc token hợp lệ

        const messages = [];
        fcmData.forEach(({ ID_user, tokens }) => {
            if (tokens && tokens.length > 0) {
                tokens.forEach(token => {
                    messages.push({
                        token,
                        notificationId: notificationMap[ID_user.toString()],
                    });
                });
            }
        });

        if (messages.length === 0) return true; // ⛔ Không có dữ liệu hợp lệ

        // 🚀 Gửi từng thông báo riêng lẻ
        await Promise.all(messages.map(({ token, notificationId }) =>
            axios.post(
                //`http://localhost:3001/gg/send-notification`,
                `https://linkage.id.vn/gg/send-notification`,
                {
                    fcmTokens: [token], // Chỉ gửi cho 1 user
                    title: "Thông báo",
                    body: null,
                    ID_noties: [notificationId], // Notification tương ứng
                })
        ));

        return true; // Thành công
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function deleteMember(ID_group, ID_user) {
    try {
        const updatedGroup = await group.findByIdAndUpdate(
            ID_group,
            { $pull: { members: ID_user } }, // MongoDB $pull để xóa phần tử khỏi mảng
            { new: true } // Trả về nhóm đã cập nhật
        );

        if (!updatedGroup) {
            console.log(`Không tìm thấy nhóm với ID: ${ID_group}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`Lỗi khi xóa thành viên: ${error.message}`);
        throw error;
    }
}

async function passKey(ID_group, oldAdmin, newAdmin) {
    try {
        const editGroup = await group.findById(ID_group);
        // null là ko tìm thấy
        if (editGroup) {
            const indexOld = editGroup.members.indexOf(oldAdmin);
            const indexNew = editGroup.members.indexOf(newAdmin);
            // ko tìm thấy ID_user trong members
            if (indexOld == -1 || indexNew == -1) {
                return false;
            }
            // swap
            const newMembers = editGroup.members.map((val, i) =>
                i === indexOld
                    ? newAdmin
                    : i === indexNew
                        ? oldAdmin
                        : val
            );
            editGroup.members = newMembers
                ? newMembers
                : editGroup.members;
            await editGroup.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function deleteGroup(ID_group) {
    try {
        const editGroup = await group.findById(ID_group);
        // null là ko tìm thấy
        if (editGroup) {
            editGroup._destroy = true;
            await editGroup.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function editAvtNameGroup(ID_group, avatar, name) {
    try {
        const editGroup = await group.findById(ID_group);
        // null là ko tìm thấy
        if (editGroup) {
            editGroup.avatar = avatar
                ? avatar
                : editGroup.avatar;
            editGroup.name = name
                ? name
                : editGroup.name;
            await editGroup.save();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function notiCallVideo(ID_group, ID_user, isCallVideo) {
    try {

        // 🔍 Tìm thông tin nhóm
        const groupInfo = await group.findById(ID_group);
        if (!groupInfo) {
            console.log('Không tìm thấy nhóm!');
            return false;
        }

        // 📜 Lọc danh sách thành viên (trừ người gửi)
        const memberIds = groupInfo.members
            .map(m => m.toString())
            .filter(id => id !== ID_user.toString());

        if (memberIds.length === 0) return false; // ⛔ Không có ai để gửi thông báo

        // 🔍 Tìm FCM tokens kèm `ID_user`
        const fcmTokens = await noti_token.find({ ID_user: { $in: memberIds } }).select('ID_user tokens');

        // 🛠 Tạo thông báo cho từng thành viên
        const notifications = fcmTokens.map(({ ID_user }) => ({
            ID_group: ID_group,
            ID_user: ID_user.toString(),
            type: isCallVideo ? 'Bạn có 1 cuộc gọi video đến' : 'Bạn có 1 cuộc gọi đến',
        }));

        // 💾 Lưu thông báo vào database
        const createdNotifications = await notification.insertMany(notifications);

        // 🎯 Ghép `token` với `notificationId`
        const notificationMap = createdNotifications.reduce((acc, noti) => {
            acc[noti.ID_user.toString()] = noti._id.toString();
            return acc;
        }, {});

        // 🔥 Tạo danh sách gửi thông báo từng người
        // const messages = fcmTokens
        //     .map(({ ID_user, token }) => ({
        //         token,
        //         notificationId: notificationMap[ID_user.toString()],
        //     }))
        //     .filter(({ token }) => token && token.trim().length > 0); // Lọc token hợp lệ

        const messages = [];
        fcmData.forEach(({ ID_user, tokens }) => {
            if (tokens && tokens.length > 0) {
                tokens.forEach(token => {
                    messages.push({
                        token,
                        notificationId: notificationMap[ID_user.toString()],
                    });
                });
            }
        });

        if (messages.length === 0) return true;// ⛔ Không có dữ liệu hợp lệ

        // 🚀 Gửi từng thông báo riêng lẻ
        await Promise.all(messages.map(({ token, notificationId }) =>
            axios.post(
                //`http://localhost:3001/gg/send-notification`,
                `https://linkage.id.vn/gg/send-notification`,
                {
                    fcmTokens: [token], // Chỉ gửi cho 1 user
                    title: "Thông báo",
                    body: null,
                    ID_noties: [notificationId], // Notification tương ứng
                })
        ));

        return true;

    } catch (error) {
        console.log(error);
        throw error;
    }
}