const storyViewer = require("../models/storyViewer");
const post = require("../models/post");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");
const axios = require("axios");

module.exports = {
    addStoryViewer_reaction,
    storyViewerOfStory,
};

// Hàm xử lý khi user xem story
async function storyViewerOfStory(ID_post, ID_user) {
    try {
        // 📌 Kiểm tra xem user đã xem story này chưa
        let storyViewer_user = await storyViewer.findOne({
            ID_post: ID_post,
            ID_user: ID_user,
        }).lean();

        if (!storyViewer_user) {
            // Nếu chưa xem, tạo bản ghi mới với ID_reaction là null
            storyViewer_user = await storyViewer.create({
                ID_post: ID_post,
                ID_user: ID_user,
                ID_reaction: null,
            });
        }

        // Lấy tất cả storyViewer của story này
        const data = await storyViewer
            .find({ ID_post: ID_post })
            .populate("ID_user", "first_name last_name avatar")
            .populate("ID_reaction", "name icon")
            .sort({ createdAt: -1 })
            .lean();

        return {
            status: true,
            message: "Lấy danh sách storyViewer thành công",
            data: data,
        };
    } catch (error) {
        console.error("Lỗi getStoryViewerOfStory:", error);
        return {
            status: false,
            message: "Lỗi API",
            error: error.message,
        };
    }
}

// Hàm xử lý khi user thả biểu cảm (reaction) vào story
async function addStoryViewer_reaction(ID_post, ID_user, ID_reaction) {
    try {
        // 📌 Kiểm tra xem bài viết có tồn tại không
        const postInfo = await post.findById(ID_post);
        if (!postInfo) {
            return { status: false, message: "Không tìm thấy bài viết" };
        }

        // 📌 Chủ bài viết
        const postOwner = postInfo.ID_user.toString();

        // 📌 Kiểm tra xem user đã xem story này chưa
        const existingStoryViewer = await storyViewer.findOne({
            ID_post,
            ID_user,
        });

        if (!existingStoryViewer) {
            return {
                status: false,
                message: "User chưa xem story này, không thể thả biểu cảm",
            };
        }

        // Cập nhật ID_reaction cho bản ghi storyViewer đã có
        const updatedStoryViewer = await storyViewer
            .findOneAndUpdate(
                { ID_post, ID_user },
                { ID_reaction },
                { new: true }
            )
            .populate("ID_user", "first_name last_name avatar")
            .populate("ID_reaction", "name icon")
            .lean();

        // 🔔 Tạo thông báo nếu người thả reaction không phải là chủ bài viết
        if (ID_user !== postOwner) {
            const newNotification = new notification({
                ID_post: updatedStoryViewer.ID_post,
                ID_user: postOwner, // Gửi thông báo cho chủ bài viết
                type: "Đã thả biểu cảm vào story của bạn",
            });

            const savedNotification = await newNotification.save();

            // 📤 Gửi thông báo FCM
            const fcmToken = await noti_token
                .findOne({ ID_user: postOwner })
                .select("ID_user tokens");

            if (fcmToken && fcmToken.tokens) {
                await axios.post(
                    `https://linkage.id.vn/gg/send-notification`,
                    {
                        fcmTokens: fcmToken.tokens,
                        title: "Thông báo",
                        body: null,
                        ID_noties: [savedNotification._id.toString()],
                    }
                );
            }
        }

        return {
            status: true,
            message: "Thả biểu cảm thành công",
            storyViewer: updatedStoryViewer,
        };
    } catch (error) {
        console.error("Lỗi addStoryViewer_reaction:", error);
        return {
            status: false,
            message: "Lỗi API",
            error: error.message,
        };
    }
}