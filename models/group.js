const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const group = new Schema({
    name: {
        type: String, // kiểu dữ liệu
        default: null,
    },
    avatar: {
        type: String, // kiểu dữ liệu
        default: 'https://firebasestorage.googleapis.com/v0/b/hamstore-5c2f9.appspot.com/o/Linkage-Logo%2FGroup%201%201.png?alt=media&token=bcd761a4-a236-437f-962b-a12b01e57497',
    },
    members: [{
        type: ObjectId,
        ref: 'user'
    }],
    isPrivate: { // Đánh dấu là nhóm riêng tư 2 người
        type: Boolean,
        default: true
    },
    _destroy: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.group || mongoose.model('group', group);
