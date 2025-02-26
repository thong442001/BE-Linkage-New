const post_reaction = require("../models/post_reaction");

module.exports = {
    addPost_Reaction,
}

async function addPost_Reaction(ID_post, ID_user, ID_reaction) {
    try {
        const checkPost_Reaction = await post_reaction.findOneAndUpdate(
            { ID_post, ID_user },
            { ID_reaction },  // Nếu tồn tại, chỉ cập nhật ID_reaction
            { new: true }  // Trả về dữ liệu mới sau khi update
        );

        if (checkPost_Reaction) {
            return { status: true, message: "Đổi reaction thành công" };
        }

        // Nếu không tìm thấy, tạo mới
        const newPost_Reaction = new post_reaction({ ID_post, ID_user, ID_reaction });
        await newPost_Reaction.save();

        return { status: true, message: "Tạo post_reaction mới thành công" };
    } catch (error) {
        console.error("Lỗi addPost_Reaction:", error);
        return { status: false, message: "Lỗi API", error: error.message };
    }
}


