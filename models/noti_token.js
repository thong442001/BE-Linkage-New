const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const noti_token = new Schema({
    ID_user: {
        type: ObjectId,
        ref: 'user',
    },
    token: {
        type: String,
        default: null
    },
}, {
    timestamps: true
});
module.exports = mongoose.models.noti_token || mongoose.model('noti_token', noti_token);
