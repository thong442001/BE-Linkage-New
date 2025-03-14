const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const report_user = new Schema({
    reporters: [{
        type: ObjectId,
        ref: 'user'
    }],
    ID_user: {
        type: ObjectId,
        ref: 'user',
    },
    status: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
    _destroy: {
        type: Boolean, // kiểu dữ liệu
        default: false
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.report_user || mongoose.model('report_user', report_user);
