const comment_reaction = require("../models/comment_reaction");

module.exports = {
    addComment_Reaction,
    deleteComment_reaction,
}

async function addComment_Reaction(ID_comment, ID_user, ID_reaction) {
    try {
        // Kiểm tra xem user đã react vào post chưa
        const checkComment_Reaction = await comment_reaction.findOneAndUpdate(
            { ID_comment, ID_user },
            { ID_reaction },  // Nếu tồn tại, chỉ cập nhật ID_reaction
            { new: true }  // Trả về dữ liệu mới sau khi update
        );

        if (checkComment_Reaction) {
            return {
                status: true,
                message: "Đổi reaction thành công",
                comment_reaction: {
                    _id: checkComment_Reaction._id,
                    ID_comment: checkComment_Reaction.ID_comment,
                    ID_user: checkComment_Reaction.ID_user,
                    ID_reaction: checkComment_Reaction.ID_reaction
                }
            };
        }

        // Nếu chưa có reaction trước đó, tạo mới
        const newComment_Reaction = new comment_reaction({ ID_comment, ID_user, ID_reaction });
        const savedReaction = await newComment_Reaction.save();

        return {
            status: true,
            message: "Tạo post_reaction mới thành công",
            comment_reaction: {
                _id: savedReaction._id,
                ID_comment: savedReaction.ID_comment,
                ID_user: savedReaction.ID_user,
                ID_reaction: savedReaction.ID_reaction
            }
        };
    } catch (error) {
        console.error("Lỗi addComment_Reaction:", error);
        return { status: false, message: "Lỗi API", error: error.message };
    }
}

// delete vĩnh viễn
async function deleteComment_reaction(_id) {
    try {
        // Xóa bài post
        await comment_reaction.findByIdAndDelete(_id)
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa bài post:", error);
        return false;
    }
}

