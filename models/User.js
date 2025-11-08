const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    userid: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: Number,
        enum: [0, 1], // 0: 부모, 1: 자녀
        required: true
    },
    house: {
        type: Schema.Types.ObjectId,
        ref: 'House',
        required: true,
        index: true
    },
    lasttime: {
        type: Number,
        required: true
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;