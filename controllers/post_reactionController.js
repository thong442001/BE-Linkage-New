const post_reaction = require("../models/post_reaction");
const post = require("../models/post");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");
const axios = require("axios");

module.exports = {
    addPost_Reaction,
    deletePost_reaction,
}

async function addPost_Reaction(ID_post, ID_user, ID_reaction) {
    try {
        // 📌 Tìm bài post để lấy thông tin chủ bài viết
        const postInfo = await post.findById(ID_post);
        if (!postInfo) {
            return { status: false, message: "Không tìm thấy bài viết" };
        }
        if (!ID_user) {
            return { status: false, message: "Không tìm thấy ID_user" };
        }
        if (!ID_reaction) {
            return { status: false, message: "Không tìm thấy ID_reaction" };
        }

        // 📌 Chủ bài viết
        const postOwner = postInfo.ID_user.toString();

        // Kiểm tra xem user đã react vào post chưa
        const existingReaction = await post_reaction.findOne({ ID_post, ID_user });

        let savedReaction;
        let message;

        if (existingReaction) {
            // Nếu đã có reaction, cập nhật ID_reaction
            const oldReactionId = existingReaction._id;

            // Xóa notification cũ liên quan đến reaction này (nếu có)
            await notification.deleteOne({ ID_post_reaction: oldReactionId });

            // Cập nhật reaction
            const updatedReaction = await post_reaction.findOneAndUpdate(
                { ID_post, ID_user },
                { ID_reaction },
                { new: true }
            );

            savedReaction = updatedReaction;
            message = "Đổi reaction thành công";
        } else {
            // Nếu chưa có reaction trước đó, tạo mới
            const newPost_Reaction = new post_reaction({ ID_post, ID_user, ID_reaction });
            savedReaction = await newPost_Reaction.save();
            message = "Tạo post_reaction mới thành công";
        }

        // 🔔 Tạo thông báo nếu người thả reaction KHÔNG PHẢI là chủ bài viết
        if (ID_user !== postOwner) {
            const newNotification = new notification({
                ID_post_reaction: savedReaction._id,
                ID_user: postOwner,
                type: "Đã thả biểu cảm vào bài viết của bạn",
            });

            const savedNotification = await newNotification.save();

            // 📤 Gửi thông báo FCM
            try {
                const fcmToken = await noti_token.findOne({ ID_user: postOwner }).select('ID_user tokens');
                if (fcmToken && fcmToken.tokens && fcmToken.tokens.length > 0) {
                    await axios.post(
                        `https://linkage.id.vn/gg/send-notification`,
                        {
                            fcmTokens: fcmToken.tokens,
                            title: "Thông báo",
                            body: null,
                            ID_noties: [savedNotification._id.toString()],
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    console.log(`FCM sent for notification ${savedNotification._id}`);
                } else {
                    console.log(`No valid FCM tokens found for user ${postOwner}`);
                }
            } catch (fcmError) {
                console.error(`Lỗi gửi FCM notification for user ${postOwner}:`, fcmError.response?.data || fcmError.message);
                // Tiếp tục trả về kết quả thành công ngay cả khi FCM thất bại
            }
        }

        return {
            status: true,
            message,
            post_reaction: {
                _id: savedReaction._id,
                ID_post: savedReaction.ID_post,
                ID_user: savedReaction.ID_user,
                ID_reaction: savedReaction.ID_reaction,
            },
        };
    } catch (error) {
        console.error("Lỗi addPost_Reaction:", error);
        return { status: false, message: "Lỗi API", error: error.message };
    }
}

// delete vĩnh viễn
async function deletePost_reaction(_id) {
    try {
        // Xóa notification liên quan đến reaction trước
        await notification.deleteOne({ ID_post_reaction: _id });
        // Xóa bài post_reaction
        await post_reaction.findByIdAndDelete(_id)
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa bài post:", error);
        return false;
    }
}