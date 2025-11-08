const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StoreProductSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    price: {
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

const StoreProduct = mongoose.model('StoreProduct', StoreProductSchema);
module.exports = StoreProduct;