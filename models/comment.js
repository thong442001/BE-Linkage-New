const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const comment = new Schema({
    ID_user: {
        type: ObjectId,
        ref: 'user',
    },
    ID_post: {
        type: ObjectId,
        ref: 'post',
    },
    content: {
        type: String, // kiểu dữ liệu
        required: true,
    },
    type: { // kiểu tin nhắn
        type: String, // kiểu dữ liệu
        enum: ['text', 'image', 'video'],
        default: "text",
    },
    ID_comment_reply: {
        type: ObjectId,
        ref: 'comment',
        default: null,
    },
    _destroy: {// thu hồi
        type: Boolean, // kiểu dữ liệu
        default: false
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.comment || mongoose.model('comment', comment);
