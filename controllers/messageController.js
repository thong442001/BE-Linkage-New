const message = require("../models/message");
const message_reaction = require("../models/message_reaction");

module.exports = {
    addMessage,
    getMessagesGroup,
    set_destroyTrue,
}

async function addMessage(ID_group, sender, content, type, ID_message_reply) {
    try {
        const newItem = {
            ID_group,
            sender,
            content,
            type,
            ID_message_reply,
            createdAt: Date.now(),
        };
        const newMess = await message.create(newItem);
        //console.log(newMess);
        return newMess;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function getMessagesGroup(ID_group) {
    try {
        // lấy tất cả tin nhắn trong nhóm
        const messages = await message.find({ ID_group: ID_group })
            .populate('sender', 'displayName avatar')
            .populate("ID_message_reply", "content") // Lấy đầy đủ thông tin của tin nhắn trả lời
            .sort({ createdAt: 1 })
            .lean() // Lấy kết quả dưới dạng object JavaScript để thêm thuộc tính cho group

        // lấy tất cả biểu cảm của từng tin nhắn
        const updatedMessages = await Promise.all(messages.map(async (message) => {
            //console.log(message._id)
            const message_reactionList = await message_reaction.find({ ID_message: message._id })
                .populate('ID_user', 'displayName avatar')
                .populate('ID_reaction', 'name icon')
                .sort({ createdAt: 1 })
                .lean() // Lấy kết quả dưới dạng object JavaScript để thêm thuộc tính cho message
            //console.log(message_reactionList.length)
            return {
                ...message,
                message_reactionList: message_reactionList || [] // Tránh lỗi khi message_reactionList là null
            };
        }));

        return updatedMessages;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function set_destroyTrue(ID_message) {
    try {
        const messageEdit = await message.findById(ID_message)
        if (messageEdit) {
            // thu hồi
            messageEdit._destroy = true;
            await messageEdit.save();
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
        throw error;
    }
}