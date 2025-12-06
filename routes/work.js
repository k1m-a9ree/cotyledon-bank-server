/** @todo 알바 crud api 만들기 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

const Work = require('../models/Work');
const House = require('../models/House');
const Child = require('../models/Child');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PointLog = require('../models/PointLog');

const isLoggedIn = require('../middleware/isLoggedin');
const ExpressError = require('../utils/ExpressError');

const workSchema = Joi.object({
    work: Joi.object({
        name: Joi.string().required(),
        todo: Joi.string().required(),
        salary: Joi.number().min(1).required(),
        password: Joi.string().required()
    }).required()
});

const validateWork = (req, res, next) => {
    if (!req.body) req.body = {};
    const { error } = workSchema.validate(req.body);
    
    if (error) {
        const message = error.details.map((e) => e.message).join(', ');
        throw new ExpressError(message, 400);
    } else {
        next();
    }
};

router.get('/', isLoggedIn, async (req, res) => {
    const house = await House.findById(req.session.houseid);
    
    const works = await Work.find({ house: house._id });
    const worksMasked = works.map((e) => {
        return {
            name: e.name,
            todo: e.todo,
            salary: e.salary,
            id: e.id,
            password: (req.session.role == 0 ? e.password : null)
        };
    });

    res.json({ success: true, works: worksMasked });
});

router.post('/', isLoggedIn, validateWork, async (req, res) => {
    if (req.session.role != 0) throw new ExpressError('you are not parent', 401);

    const house = await House.findById(req.session.houseid);
    const newWork = new Work({ ...req.body.work, house: house });

    await newWork.save();
    
    res.json({ success: true, work: {
        id: newWork.id,
        name: newWork.name,
        todo: newWork.todo,
        salary: newWork.salary,
        password: newWork.password
    } });
});

// 이거는 부모가 지우는 delete임
router.delete('/:id/parent', isLoggedIn, async (req, res) => {
    if (req.session.role != 0) throw new ExpressError('you are not parent', 401);
    
    const work = await Work.findById(req.params.id);
    if (!work) throw new ExpressError('cant find work', 404);

    const house = await House.findById(req.session.houseid);
    if (!house.equals(work.house)) throw new ExpressError('you are not in work\'s house', 401);

    await work.deleteOne();
    res.json({ success: true });
});

// 이거는 아이가 일 해서 지우는 delete임
router.post('/:id', isLoggedIn, async (req, res) => {
    if (req.session.role != 1) throw new ExpressError('you are not child', 401);

    const work = await Work.findById(req.params.id);
    if (!work) throw new ExpressError('cant find work', 404);

    const house = await House.findById(req.session.houseid);
    if (!house.equals(work.house)) throw new ExpressError('you are not in work\'s house', 401);

    const user = await User.findOne({ userid: req.session.userid });
    const child = await Child.findOne({ user: user._id });

    if (!req.body || !req.body.password) throw new ExpressError('비밀번호를 입력하세요', 400);

    if (work.password != req.body.password) throw new ExpressError('비밀번호가 틀립니다. 다시 입력하세요', 400);

    child.point += work.salary;
    await child.save();
    
    await work.deleteOne();

    const noti = new Notification({ user: user, content: `${ work.name } 알바를 완료하였습니다`, time: Math.floor(Date.now() / (1000 * 60 * 60))});
    await noti.save();

    const pointlog = new PointLog({ point: child.point, comment: `${ work.name } 알바비`, time: Math.floor(Date.now() / (1000 * 60 * 60)), child: child });
    await pointlog.save();

    res.json({ success: true, work: work });
});




module.exports = router;