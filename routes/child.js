/** @todo 포인트 patch기능 만들기 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

const Child = require('../models/Child');
const User = require('../models/User');
const House = require('../models/House');
const PointLog = require('../models/PointLog');
const isLoggedIn = require('../middleware/isLoggedin');
const ExpressError = require('../utils/ExpressError');

const pointSchema = Joi.object({
    changedPoint: Joi.number().min(0).required()
});

const validatePoint = (req, res, next) => {
    if (!req.body) req.body = {};
    const { error } = pointSchema.validate(req.body);

    if (error) {
        const msg = error.details.map(el => el.message).join(', ');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}
router.get('/', isLoggedIn, async (req, res) => {
    if (req.session.role != 0) throw new ExpressError('you are not parent', 401);

    const house = await House.findById(req.session.houseid);
    const users = await User.find({ house: house._id });

    let children = [];
    for (const user of users) {
        const child = await Child.findOne({ user: user._id });
        if (!child) continue;
        else children.push({
            name: user.username,
            id: child.id,
            point: child.point
        });
    }

    res.json({ success: true, children });
})

router.get('/point', isLoggedIn, async (req, res) => {
    if (req.session.role != 1) throw new ExpressError('you are not child', 401);
    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });
    const pointLogs = (await PointLog.find({ child: child._id }).sort({ time: -1, createdAt: -1 }).limit(30)).reverse();

    res.json({ success: true, point: child.point, pointLogs: pointLogs });
})

router.get('/stage', isLoggedIn, async (req, res) => {
    if (req.session.role != 1) throw new ExpressError('you are not child', 401);
    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });

    res.json({ success: true, stage: child.stage });
})

router.patch('/stage/:num', isLoggedIn, async (req, res) => {
    if (req.session.role != 1) throw new ExpressError('아이가 아닙니다', 401);
    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });
    
    const { num } = req.params;
    if (child.stage + 1 != num) throw new ExpressError('이 단계를 깰 자격이 없습니다', 401);
    child.stage = num;
    await child.save();
    res.json({ success: true });
})

router.patch('/:id', isLoggedIn, validatePoint, async (req, res) => {
    // 부모인지 확인
    if (req.session.role != 0) throw new ExpressError('you are not parent', 401);

    // 데베에서 자녀 찾아서 가져오기
    const child = await Child.findById(req.params.id);
    if (!child) throw new ExpressError('cant find child', 404);
    
    // 자녀의 유저 데이터 찾아서 => 집 찾아서 => 세션에 저장되어 있는 부모 집이랑 비교해서 => 한가족인지 확인
    const childuser = await User.findById(child.user);
    const compareHouse = childuser.house.equals(req.session.houseid);
    if (!compareHouse) throw new ExpressError('you are not family', 401); 
    
    // 포인트 업데이트 후 save
    const { changedPoint } = req.body;
    child.point = changedPoint;
    await child.save();

    res.json({ success: true, point: changedPoint });
});



module.exports = router;