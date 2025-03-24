const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const report_user = new Schema({
    reports: [{
        ID_reason: {
            type: ObjectId,
            ref: 'reason',
            required: true, // bắt buộc phải có
        },
        reporters: [{
            type: ObjectId,
            ref: 'User',
            required: true, // bắt buộc phải có
        }]
    }],
    ID_user: {
        type: ObjectId,
        ref: 'user',
    },
    reason: {
        type: String, // kiểu dữ liệu
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.report_user || mongoose.model('report_user', report_user);
