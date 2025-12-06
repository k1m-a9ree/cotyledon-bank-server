/** 
 * @todo 상품 crud 만들기
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

const StoreProduct = require('../models/StoreProduct');
const House = require('../models/House');
const Child = require('../models/Child');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PointLog = require('../models/PointLog');

const ExpressError = require('../utils/ExpressError');
const isLoggedIn = require('../middleware/isLoggedin');


const strProSchema = Joi.object({
    storeProduct: Joi.object({
        name: Joi.string().required(),
        price: Joi.number().min(1).required()
    }).required()
});

const validateStrPro = (req, res, next) => {
    if (!req.body) req.body = {};
    const { error } = strProSchema.validate(req.body);
    
    if (error) {
        const message = error.details.map((e) => e.message).join(', ');
        throw new ExpressError(message, 400);
    } else {
        next();
    }
}


router.get('/', isLoggedIn, async (req, res) => {
    const strPros = await StoreProduct.find({ house: req.session.houseid });

    const strProsMasked = strPros.map((e) => {
        return {
            name: e.name,
            price: e.price,
            id: e.id
        };
    });

    res.json({ success: true, storeProducts: strProsMasked });
});

router.post('/', isLoggedIn, validateStrPro, async (req, res) => {
    if (req.session.role != 0) throw new ExpressError('you are not parent', 401);

    const { name, price } = req.body.storeProduct;
    const house = await House.findById(req.session.houseid);

    const newStoreProduct = new StoreProduct({
        name: name,
        price: price,
        house: house
    });
    await newStoreProduct.save();

    res.json({ success: true, product: {
        id: newStoreProduct.id,
        name: newStoreProduct.name,
        price: newStoreProduct.price
    } });
});

// id는 StoreProduct id임
router.patch('/:id', isLoggedIn, validateStrPro, async (req, res) => {
    if (req.session.role != 0) throw new ExpressError('you are not parent', 401);

    const product = await StoreProduct.findById(req.params.id);
    
    // 존재하는 상품인지 확인
    if (!product) throw new ExpressError('product not exist', 404);

    // 상품의 house랑 로그인 한 사람의 house 같은지 확인하기
    const house = await House.findById(req.session.houseid);
    if (!house.equals(product.house)) throw new ExpressError('you are not in product\'s house', 401); 

    // 업데이트 하기
    if (!req.body || !req.body.storeProduct) throw new ExpressError('need to input', 400);
    const { name, price } = req.body.storeProduct;
    if (!name || !price) throw new ExpressError('need to input', 400);
    product.name = name;
    product.price = price;
    await product.save();
    
    res.json({ success: true });
});

// 여기는 부모가 삭제할 수 있는 곳임. 여기 id도 StoreProduct
router.delete('/:id/parent', isLoggedIn, async (req, res) => {
    if (req.session.role != 0) throw new ExpressError('you are not parent', 401);

    const product = await StoreProduct.findById(req.params.id);

    // 존재하는 상품인지 확인
    if (!product) throw new ExpressError('can\'t find product', 404);
    // 상품의 house랑 로그인 한 사람의 house 같은지 확인하기
    const house = await House.findById(req.session.houseid);
    if (!house.equals(product.house)) throw new ExpressError('you are not in product\'s house', 401); 

    await product.deleteOne();

    res.json({ success: true });
});

// 여기는 아이가 상품을 구매하면서 상품이 삭제되는 곳임. 여기도 id는 StoreProduct
router.delete('/:id', isLoggedIn, async (req, res) => {
    if (req.session.role != 1) throw new ExpressError('you are not child', 401);

    const product = await StoreProduct.findById(req.params.id);
    if (!product) throw new ExpressError('can\'t find product', 404);

    // 상품의 house랑 로그인 한 사람의 house 같은지 확인하기
    const house = await House.findById(req.session.houseid);
    if (!house.equals(product.house)) throw new ExpressError('you are not in product\'s house', 401); 

    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });

    if (child.point < product.price) { throw new ExpressError('you dont have point..', 400); }
    child.point -= product.price;
    await child.save();

    const deletedProduct = await StoreProduct.findByIdAndDelete(product._id);

    const noti = new Notification({ user: user, content: `${deletedProduct.name} 구매완료`, time: Math.floor(Date.now() / (1000 * 60 * 60))});
    await noti.save();

    const point = new PointLog({ point: child.point, comment: `${ deletedProduct.name } 구매`, time: Math.floor(Date.now() / (1000 * 60 * 60)), child: child });

    res.json({ success: true, product: deletedProduct });
});

module.exports = router;