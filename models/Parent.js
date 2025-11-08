const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ParentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
});

const Parent = mongoose.model('Parent', ParentSchema);
module.exports = Parent;