const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const noti_token = new Schema({
    ID_user: {
        type: ObjectId,
        ref: 'user',
        required: true, // bắt buộc phải có
        unique: true, // không được trùng
    },
    tokens: {
        type: [String], // Mảng các token FCM
        default: [] // Để mảng rỗng khi chưa có token
    }
}, {
    timestamps: true
});
module.exports = mongoose.models.noti_token || mongoose.model('noti_token', noti_token);
