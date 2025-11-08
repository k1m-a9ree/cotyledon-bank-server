const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WorkSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    todo: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    house: {
        type: Schema.Types.ObjectId,
        ref: 'House',
        required: true,
        index: true
    }
});

const Work = mongoose.model('Work', WorkSchema);
module.exports = Work;