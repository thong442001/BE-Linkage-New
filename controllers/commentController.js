const comment = require("../models/comment");
const post = require("../models/post");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");
const axios = require("axios");

module.exports = {
    addComment,
    setComment_destroyTrue,
};

async function addComment(ID_user, ID_post, content, type, ID_comment_reply = null) {
    try {
        // 📌 Tìm bài post để lấy thông tin chủ bài viết
        const postInfo = await post.findById(ID_post);
        if (!postInfo) {
            return false;
        }
        const postOwner = postInfo.ID_user.toString();

        // 📌 Tạo bình luận mới
        const newItem = {
            ID_user,
            ID_post,
            content,
            type,
            ID_comment_reply: ID_comment_reply || undefined, // Nếu null thì không lưu vào DB
        };
        const newComment = await comment.create(newItem);
        await newComment.populate('ID_user', 'first_name last_name avatar');

        // 📌 Tìm thông tin bình luận gốc (nếu có)
        let repliedUser = null;
        if (ID_comment_reply) {
            const repliedComment = await comment.findById(ID_comment_reply).populate('ID_user', 'first_name last_name avatar');
            repliedUser = repliedComment ? repliedComment.ID_user : null;
            await newComment.populate({ path: 'ID_comment_reply', populate: { path: 'ID_user', select: 'first_name last_name avatar' } });
        }

        // 📌 Danh sách người cần thông báo
        const notifyUsers = new Set();
        if (postOwner !== ID_user) notifyUsers.add(postOwner); // Chủ bài viết
        if (repliedUser && repliedUser._id.toString() !== ID_user) notifyUsers.add(repliedUser._id.toString()); // Người được trả lời

        if (notifyUsers.size === 0) return newComment; // Không có ai để thông báo

        // 📌 Tìm FCM tokens của những người cần thông báo
        const fcmTokens = await noti_token.find({ ID_user: { $in: Array.from(notifyUsers) } }).select('ID_user tokens');

        // 📌 Tạo danh sách thông báo
        const notifications = Array.from(notifyUsers).map(userId => ({
            ID_comment: newComment._id,
            ID_user: userId,
            type: userId === postOwner ? "Đã bình luận vào bài viết của bạn" : "Đã trả lời bình luận của bạn",
        }));

        // 📌 Lưu thông báo vào DB
        const createdNotifications = await notification.insertMany(notifications);

        // 📌 Ghép `token` với `notificationId`
        const notificationMap = createdNotifications.reduce((acc, noti) => {
            acc[noti.ID_user.toString()] = noti._id.toString();
            return acc;
        }, {});

        // 📌 Tạo danh sách gửi FCM
        // const messages = fcmTokens
        //     .map(({ ID_user, token }) => ({
        //         token,
        //         notificationId: notificationMap[ID_user.toString()],
        //     }))
        //     .filter(({ token }) => token && token.trim().length > 0);

        const messages = [];
        fcmTokens.forEach(({ ID_user, tokens }) => {
            if (tokens && tokens.length > 0) {
                tokens.forEach(token => {
                    messages.push({
                        token,
                        notificationId: notificationMap[ID_user.toString()],
                    });
                });
            }
        });

        if (messages.length === 0) return newComment; // Không có token hợp lệ

        // 📌 Gửi thông báo FCM song song
        await Promise.all(messages.map(({ token, notificationId }) =>
            axios.post(
                //`http://localhost:3001/gg/send-notification`,
                `https://linkage.id.vn/gg/send-notification`,
                {
                    fcmTokens: [token], // Chỉ gửi cho 1 người
                    title: "Thông báo",
                    body: null,
                    ID_noties: [notificationId],
                }
            )
        ));

        return newComment;
    } catch (error) {
        console.error("Error in addComment:", error);
        throw error; // Ném lỗi để phía trên xử lý
    }
}



async function setComment_destroyTrue(ID_comment) {
    try {
        const commentEdit = await comment.findById(ID_comment);
        if (!commentEdit) return false; // Kiểm tra nếu không tìm thấy

        commentEdit._destroy = true;
        const newComment = await commentEdit.save();

        await newComment.populate('ID_user', 'first_name last_name avatar')
            .populate({
                path: 'ID_comment_reply',
                populate: { path: 'ID_user', select: 'first_name last_name avatar' },
                select: 'content'
            }).lean();

        return newComment;
    } catch (error) {
        console.error("Error in setComment_destroyTrue:", error);
        throw error;
    }
}
