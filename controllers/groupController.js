const group = require("../models/group");
const message = require("../models/message");

module.exports = {
    findGroupPrivate,
    addGroupPrivate,
    getGroupID,
    getAllGroupOfUser,
    addGroup,
    addtMembers,
    deleteMember,
    passKey,
    deleteGroup
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
        const newItem = {
            name: name,
            members: members,
            isPrivate: false,
        };
        const newGroup = await group.create(newItem);
        //console.log(newGroup);
        return newGroup;
    } catch (error) {
        console.log(error);
        return false;
    }
}

//
async function getGroupID(ID_group) {
    try {
        const result = await group.findById(ID_group).populate({
            path: 'members',
            select: 'first_name last_name avatar' // Chỉ lấy trường name và email (_id auto lấy)
        });
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
            .lean() // Lấy kết quả dưới dạng object JavaScript để thêm thuộc tính cho group
            .exec();
        // Lấy tin nhắn mới nhất của từng nhóm bằng Promise.all()
        const updatedGroups = await Promise.all(groups.map(async (group) => {
            const messageNew = await message.find({ ID_group: group._id })
                .populate('sender', 'first_name last_name avatar')
                .sort({ createdAt: -1 })
                .limit(1);

            if (messageNew.length > 0) {
                group.messageLatest = {
                    ID_message: messageNew[0]._id,
                    sender: {
                        ID_user: messageNew[0].sender._id,
                        first_name: messageNew[0].sender.first_name,
                        last_name: messageNew[0].sender.last_name,
                        //displayName: messageNew[0].sender.displayName,
                        avatar: messageNew[0].sender.avatar,
                    },
                    content: messageNew[0].content,
                    createdAt: messageNew[0].createdAt,
                    _destroy: messageNew[0]._destroy,
                };
            } else {
                group.messageLatest = null;
            }
            //console.log(group.messageLatest);
            return group; // ✅ Quan trọng: Return group để cập nhật giá trị
        }));
        return updatedGroups.filter(group => group && (group.messageLatest != null || group.isPrivate == false));
    } catch (error) {
        console.error("Lỗi khi lấy nhóm:", error);
        throw error;
    }
}

// edit 
async function addtMembers(ID_group, new_members) {
    try {
        const editGroup = await group.findById(ID_group);
        // null là ko tìm thấy
        if (editGroup) {
            editGroup.members = new_members
                ? [...new Set([...editGroup.members, ...new_members])]// set sẽ tự động loại bỏ các phần tử trùng.
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

async function deleteMember(ID_group, ID_user) {
    try {
        const editGroup = await group.findById(ID_group);
        // null là ko tìm thấy
        if (editGroup) {
            editGroup.members = ID_user
                ? editGroup.members.filter(ID_member => ID_member !== ID_user)// xóa member
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