const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const report_post = new Schema({
    // reporters: [{
    //     type: ObjectId,
    //     ref: 'user'
    // }],
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
    ID_post: {
        type: ObjectId,
        ref: 'post',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.report_post || mongoose.model('report_post', report_post);
