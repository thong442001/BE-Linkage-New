const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const relationship = new Schema({
    ID_userA: {
        type: ObjectId,
        ref: 'user',
        required: true, // Thêm required để đảm bảo trường không bị thiếu
    },
    ID_userB: {
        type: ObjectId,
        ref: 'user',
        required: true, // Thêm required để đảm bảo trường không bị thiếu
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
        required: true, // Thêm required để đảm bảo trường không bị thiếu
        default: 'Người lạ', // Giá trị mặc định khi tạo mới
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.relationship || mongoose.model('relationship', relationship);
