const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HouseSchema = new Schema({
    housename: {
        type: String, 
        required: true,
        unique: true
    }
});

const House = mongoose.model('House', HouseSchema);
module.exports = House;