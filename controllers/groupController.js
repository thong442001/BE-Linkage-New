const group = require("../models/group");
const message = require("../models/message");

module.exports = {
    findGroupPrivate,
    addGroupPrivate,
    getGroupID,
    getAllGroupOfUser,
}
//
async function addGroupPrivate(user1, user2) {
    try {
        const members = [user1, user2]
        const newItem = {
            members,
            createdAt: Date.now(),
        };
        const newGroupPrivate = await group.create(newItem);
        //console.log(newGroup);
        return newGroupPrivate;
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
        const groups = await group.find({ members: ID_user })
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
        return updatedGroups.filter(group => group && group.messageLatest != null);
    } catch (error) {
        console.error("Lỗi khi lấy nhóm:", error);
        throw error;
    }
}

