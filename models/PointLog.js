const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PointLogSchema = new Schema({
    point: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    time: {
        type: Number,
        required: true
    },
    child: {
        type: Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
        index: true
    }
}, { timestamps: true });

PointLogSchema.index({ time: -1, createdAt: -1 })
const PointLog = mongoose.model('PointLog', PointLogSchema);
module.exports = PointLog;