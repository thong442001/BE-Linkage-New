const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const reason = new Schema({
    reason_text: {
        type: String,
        required: true, // bắt buộc phải có
        unique: true, // không được trùng
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.reason || mongoose.model('reason', reason);
