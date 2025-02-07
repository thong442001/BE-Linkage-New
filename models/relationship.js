const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const relationship = new Schema({
    ID_userA: {
        type: ObjectId,
        ref: 'user',
    },
    ID_userB: {
        type: ObjectId,
        ref: 'user',
    },
    relation: { // kiểu tin nhắn
        type: String, // kiểu dữ liệu
        enum: [
            'Người lạ',
            'Bạn bè',
            'A chặn B',
            'B chặn A',
            'A gửi lời kết bạn B',
            'B gửi lời kết bạn A',
        ],
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.relationship || mongoose.model('relationship', relationship);
