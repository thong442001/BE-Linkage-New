const notification = require("../models/notification");

module.exports = {
    getAllNotificationOfUser,
    setStatusSeen,
}

async function getAllNotificationOfUser(ID_user) {
    try {

        const notifications = await notification.find({ ID_user: ID_user })
            .populate({
                path: 'ID_post',
                populate: [
                    { path: 'ID_user', select: 'first_name last_name avatar' },
                    { path: 'tags', select: 'first_name last_name avatar' },
                    {
                        path: 'ID_post_shared',
                        select: '-__v',
                        populate: [
                            { path: 'ID_user', select: 'first_name last_name avatar' },
                            { path: 'tags', select: 'first_name last_name avatar' }
                        ]
                    }
                ],
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v
            })
            .populate({
                path: 'ID_relationship',
                populate: [
                    { path: 'ID_userA', select: 'first_name last_name avatar' },
                    { path: 'ID_userB', select: 'first_name last_name avatar' },
                ],
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
            })
            .populate({
                path: 'ID_group',
                populate: [
                    { path: 'members', select: 'first_name last_name avatar' },
                ],
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
            })
            .populate({
                path: 'ID_message',
                populate: [
                    { path: 'ID_group', select: '-_v' },
                    { path: 'sender', select: 'first_name last_name avatar' },
                ],
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
            })
            .populate({
                path: 'ID_comment',
                populate: [
                    { path: 'ID_user', select: 'first_name last_name avatar' },
                    { path: 'ID_post', select: '-_v' },
                ],
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
            })
            .populate({
                path: 'ID_post_reaction',
                populate: [
                    { path: 'ID_post', select: '-_v' },
                    { path: 'ID_user', select: 'first_name last_name avatar' },
                    { path: 'ID_reaction', select: '-_v' },
                ],
                select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
            })
            .sort({ createdAt: -1 })
            .lean();

        return notifications; // Trả về danh sách thay vì `true`
    } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo:", error);
        throw error;
    }
}


async function setStatusSeen(_id) {
    try {
        if (!_id) {
            throw new Error("Thiếu ID của notification cần");
        }
        const notifi = await notification.findOne(_id);
        if (!notifi) {
            console.warn(`Không tìm thấy ID: ${_id}`);
            return false; // Không tìm thấy report
        } else {
            notifi.statusSeen = false;
            await notifi.save();
        }
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

