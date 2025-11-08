const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

NotificationSchema.index({ createdAt: -1 });
const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;