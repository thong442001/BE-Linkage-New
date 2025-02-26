const message_reaction = require("../models/message_reaction");

module.exports = {
    addMessage_Reaction,
}

async function addMessage_Reaction(ID_message, ID_user, ID_reaction) {
    try {
        // tìm coi message_reaction có chưa 
        const checkMessage_Reaction = await message_reaction.findOne({
            ID_message: ID_message,
            ID_user: ID_user,
            ID_reaction: ID_reaction
        })
        if (checkMessage_Reaction != null) {
            // nếu có rồi thì tăng quantity
            checkMessage_Reaction.quantity = checkMessage_Reaction.quantity + 1;
            await checkMessage_Reaction.save();
            return { status: true, message: "message_reaction đã tồn tại" };
        } else {
            // chưa thì tạo
            const newItem = {
                ID_message,
                ID_user,
                ID_reaction,
            };
            const newMessage_Reaction = await message_reaction.create(newItem);
            return { status: true, message: "tạo message_reaction mới thành công" };
        }
    } catch (error) {
        console.log(error);
        return { status: false, message: "Lỗi API" };
    }
}

