/** @todo 금융상품 crud 만들기 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

const finProConfig = require('../config/financialProduct');

const House = require('../models/House');
const User = require('../models/User');
const Child = require('../models/Child');
const FinancialProduct = require('../models/FinancialProduct');
const Notification = require('../models/Notification');

const ExpressError = require('../utils/ExpressError');
const isLoggedin = require('../middleware/isLoggedin');
const isChild = require('../middleware/isChild');
const update = require('../middleware/update');


router.get('/', isLoggedin, isChild, update, async (req, res) => {
    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });
    const products = await FinancialProduct.find({ child: child._id });
    res.json({
        success: true,
        financialProducts: products.map((product) => ({
            type: product.type,
            id: product.id,
            point: product.point
        }))
    })
})

router.get('/config', (req, res) => {
    res.json({
        success: true,
        configs: finProConfig
    })
})


const validateFinPro = (req, res, next) => {
    const finProSchema = Joi.object({
        financialProduct: Joi.object({
            type: Joi.string().valid(...finProConfig.enum).required(),
            period: Joi.number().min(1),
            point: Joi.number().min(0)
        }).required()
    });
    if (!req.body) req.body = {};
    const { error } = finProSchema.validate(req.body);
    
    if (error) {
        const msg = error.details.map(el => el.message).join(', ');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

// 금융 상품 가입하기
router.post('/', isLoggedin, validateFinPro, async (req, res) => {
    // 아이인지 확인
    if (req.session.role != 1) throw new ExpressError('you\'re not child', 401);
    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });

    // 새로운 상품 만들어서 저장
    const newFinPro = new FinancialProduct({
        ...req.body.financialProduct,
        child: child,
        maketime: Math.floor(Date.now() / (1000 * 60 * 60)),
        lasttime: Math.floor(Date.now() / (1000 * 60 * 60))
    });
    await newFinPro.save();

    res.json({
        success: true,
        product: {
            type: newFinPro.type,
            id: newFinPro.id,
            point: newFinPro.point
        }
    })
});

router.patch('/:productid', isLoggedin, isChild, update, async (req, res) => {
    if (req.session.role != 1) throw new ExpressError('you are not child', 401);

    const product = await FinancialProduct.findById(req.params.productid).populate('child');
    if (!product) throw new ExpressError('cant find product', 404);

    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });

    // 주소로 요청한 금융 상품의 자녀와, 세션 유저의 자녀 비교
    const compareChild = product.child.equals(child);
    if (!compareChild) throw new ExpressError('you\'re not oneself', 401);

    if (!req.body || !req.body.financialProduct) throw new ExpressError('please input', 400);
    const { point } = req.body.financialProduct;

    if (product.point > point) {
        if (!finProConfig[product.type].canWithdraw) {
            throw new ExpressError('this product cant withdraw');
        } else {
            child.point += product.point - point;
            product.point = point;
        }
    } else {
        if (!finProConfig[product.type].canDeposit) {
            throw new ExpressError('this product cant deposit');
        } else {
            child.point -= point - product.point
            product.point = point;
        }
    }

    await product.save();
    res.json({ success: true });
});

router.delete('/:productid', isLoggedin, async (req, res) => {
    if (req.session.role != 1) throw new ExpressError('you are not child', 401);

    const product = await FinancialProduct.findById(req.params.productid).populate('child');
    if (!product) throw new ExpressError('cant find product', 404);

    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });

    // 주소로 요청한 금융 상품의 자녀와, 세션 유저의 자녀 비교
    const compareChild = product.child.equals(child);
    if (!compareChild) throw new ExpressError('you\'re not oneself', 401);

    child.point += product.point;
    await child.save();
    await product.deleteOne();

    res.json({ success: true });
});

// 아이의 금융 상품 다 얻기 (id는 child의 objectId 입니다;;)
router.get('/:childid', isLoggedin, async (req, res) => {
    // 아이 찾고 유저 찾아서 집 찾고 현재 로그인 한 사람이랑 비교
    const child = await Child.findById(req.params.childid);
    if (!child) throw new ExpressError('isnt exist child', 404);
    const childuser = await User.findById(child.user);

    const compareHouse = childuser.house.equals(req.session.houseid);
    if (!compareHouse) throw new ExpressError('you are not family', 401);

    // 금융 상품 찾아서 child 정보만 빼고 응답하기
    const finPros = await FinancialProduct.find({ child: child._id });
    const finProsMasked = finPros.map((e) => {
        return {
            type: e.type,
            point: e.point
        };
    });

    res.json(finProsMasked);
});


module.exports = router;