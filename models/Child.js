const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChildSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    point: {
        type: Number,
        required: true,
        default: 0
    }
});

const Child = mongoose.model('Child', ChildSchema);
module.exports = Child;