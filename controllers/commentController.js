const comment = require("../models/comment");

module.exports = {
    addComment,
    setComment_destroyTrue,
};

async function addComment(ID_user, ID_post, content, type, ID_comment_reply) {
    try {
        const newItem = { ID_user, ID_post, content, type, ID_comment_reply };
        const newComment = await comment.create(newItem);

        await newComment.populate('ID_user', 'first_name last_name avatar')
            .populate({
                path: 'ID_comment_reply',
                populate: { path: 'ID_user', select: 'first_name last_name avatar' },
                select: 'content'
            }).execPopulate();

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
            }).execPopulate();

        return newComment;
    } catch (error) {
        console.error("Error in setComment_destroyTrue:", error);
        throw error;
    }
}
