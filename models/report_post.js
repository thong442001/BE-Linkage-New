const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const report_post = new Schema({
    reporters: [{
        type: ObjectId,
        ref: 'user'
    }],
    ID_post: {
        type: ObjectId,
        ref: 'post',
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.report_post || mongoose.model('report_post', report_post);
