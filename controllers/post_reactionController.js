const post_reaction = require("../models/post_reaction");

module.exports = {
    addPost_Reaction,
    deletePost_reaction,
}

async function addPost_Reaction(ID_post, ID_user, ID_reaction) {
    try {
        // Kiểm tra xem user đã react vào post chưa
        const checkPost_Reaction = await post_reaction.findOneAndUpdate(
            { ID_post, ID_user },
            { ID_reaction },  // Nếu tồn tại, chỉ cập nhật ID_reaction
            { new: true }  // Trả về dữ liệu mới sau khi update
        );

        if (checkPost_Reaction) {
            return {
                status: true,
                message: "Đổi reaction thành công",
                post_reaction: {
                    _id: checkPost_Reaction._id,
                    ID_post: checkPost_Reaction.ID_post,
                    ID_user: checkPost_Reaction.ID_user,
                    ID_reaction: checkPost_Reaction.ID_reaction
                }
            };
        }

        // Nếu chưa có reaction trước đó, tạo mới
        const newPost_Reaction = new post_reaction({ ID_post, ID_user, ID_reaction });
        const savedReaction = await newPost_Reaction.save();

        return {
            status: true,
            message: "Tạo post_reaction mới thành công",
            post_reaction: {
                _id: savedReaction._id,
                ID_post: savedReaction.ID_post,
                ID_user: savedReaction.ID_user,
                ID_reaction: savedReaction.ID_reaction
            }
        };
    } catch (error) {
        console.error("Lỗi addPost_Reaction:", error);
        return { status: false, message: "Lỗi API", error: error.message };
    }
}

// delete vĩnh viễn
async function deletePost_reaction(_id) {
    try {
        // Xóa bài post
        await post_reaction.findByIdAndDelete(_id)
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa bài post:", error);
        return false;
    }
}

