const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const financialProduct = require('../config/financialProduct');

const FinancialProductSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: financialProduct.enum
    },
    point: { // 금융 상품에 있는 총 돈
        type: Number,
        required: true,
        default: 0
    },
    period: { // 정기 적금 용, 달마다 내야하는 돈
        type: Number,
        default: 1
    },
    share: { // 주식 투자 용, 한 주당 가격, 달마다 업데이트해서 넣을거임
        type: [Number],
        default: [100]
    },
    next: { // 주식 투자 미래 용
        type: Number,
        default: 101
    },
    child: {
        type: Schema.Types.ObjectId,
        ref: 'Child',
        required: true,
        index: true
    },
    maketime: {
        type: Number,
        required: true
    },
    lasttime: {
        type: Number,
        required: true
    }
});

const FinancialProduct = mongoose.model('FinancialProduct', FinancialProductSchema);
module.exports = FinancialProduct;