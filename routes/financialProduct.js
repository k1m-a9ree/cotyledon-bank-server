const express = require('express');
const router = express.Router();
const Joi = require('joi');

const finProConfig = require('../config/financialProduct');

const House = require('../models/House');
const User = require('../models/User');
const Child = require('../models/Child');
const FinancialProduct = require('../models/FinancialProduct');
const Notification = require('../models/Notification');
const PointLog = require('../models/PointLog');

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
        financialProducts: products.map((product) => {
            const share = product.share;
            const newest = product.share.slice(0 > share.length-10 ? 0 : share.length-10, share.length);

            return {
                type: product.type,
                id: product.id,
                point: product.point,
                share: newest,
                comment: product.comment,
                principal: product.principal
            }
        })
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

router.post('/', isLoggedin, validateFinPro, async (req, res) => {
    // 아이인지 확인
    if (req.session.role != 1) throw new ExpressError('you\'re not child', 401);
    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });

    const { type } = req.body.financialProduct;
    if (finProConfig[type].stage > child.stage) {
        throw new ExpressError('아직 상품에 가입 할 수 없습니다', 401);
    }

    const newFinPro = new FinancialProduct({
        ...req.body.financialProduct,
        child: child,
        principal: req.body.financialProduct.point,
        maketime: Math.floor(Date.now() / (1000 * 60 * 60)),
        lasttime: Math.floor(Date.now() / (1000 * 60 * 60))
    });
    await newFinPro.save();

    child.point -= newFinPro.point;
    await child.save();
    
    const noti = new Notification({ 
        user: user,
        content: `${ finProConfig[type].korean } 가입이 완료되었습니다.`,
        time: Math.floor(Date.now() / (1000 * 60 * 60))
    });
    await noti.save();

    if (newFinPro.point != 0) {
        const pointlog = new PointLog({ point: child.point, comment: `${finProConfig[type].korean} 가입`, time: Math.floor(Date.now() / (1000 * 60 * 60)), child: child });
        await pointlog.save();
    }

    res.json({
        success: true,
        product: {
            type: newFinPro.type,
            id: newFinPro.id,
            point: newFinPro.point,
            share: newFinPro.share
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

    product.principal = product.point;
    
    await product.save();
    await child.save();

    const pointlog = new PointLog({ point: child.point, comment: `${finProConfig[product.type].korean} 입/출금`, time: Math.floor(Date.now() / (1000 * 60 * 60)), child: child });
    await pointlog.save();

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

    const noti = new Notification({ 
        user: user, 
        content: `${ finProConfig[product.type].korean } 해지가 완료되었습니다`,
        time: Math.floor(Date.now() / (1000 * 60 * 60))
    });
    await noti.save();

    if (product.point != 0) {
        const pointlog = new PointLog({ point: child.point, comment: `${finProConfig[product.type].korean} 해지`, time: Math.floor(Date.now() / (1000 * 60 * 60)), child: child });
        await pointlog.save();
    }

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