const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Joi = require('joi');

const ExpressError = require('../utils/ExpressError');
const User = require('../models/User');
const House = require('../models/House');
const Child = require('../models/Child');
const Parent = require('../models/Parent');
const isLoggedIn = require('../middleware/isLoggedin');

const validateRegister = (req, res, next) => {
    const registerSchema = Joi.object({
        user: Joi.object({
            username: Joi.string().required(),
            userid: Joi.string().required(),
            password: Joi.string().required(),
            housename: Joi.string().required(),
            role: Joi.number().valid(0, 1).required()
        }).required()
    });
    const { error } = registerSchema.validate(req.body);

    if (error) {
        const msg = error.details.map(el => el.message).join(', ');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

router.post('/register', validateRegister, async (req, res) => {
    const input = req.body.user;

    const idExist = await User.exists({ userid: input.userid });
    if (idExist) {
        throw new ExpressError('id is already exist', 400);
    }

    let house = await House.findOne({ housename: input.housename });
    if (!house) {
        house = new House({ housename: input.housename });
        await house.save();
    }

    const bcryptPassword = await bcrypt.hash(input.password, 10);
    const newUser = new User({
        username: input.username,
        userid: input.userid,
        password: bcryptPassword,
        role: input.role,
        house: house,
        lasttime: Math.floor(Date.now() / (1000 * 60 * 60))
    });
    await newUser.save();

    if (input.role == 0) {
        const newParent = new Parent({ user: newUser });
        await newParent.save();
    } else if (input.role == 1) {
        const newChild = new Child({ user: newUser });
        await newChild.save();
    }

    res.json({ success: true });
});


router.post('/login', async (req, res) => {
    if (!req.body || !req.body.user) throw new ExpressError('input id and password', 400);
    const { userid, password } = req.body.user;
    if (!userid || !password) {
        throw new ExpressError('input id and password', 400);
    }

    const user = await User.findOne({ userid: userid }).populate('house');

    if (!user) {
        throw new ExpressError('disaccord id or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ExpressError('disaccord id or password', 401);
    }

    req.session.userid = user.userid;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.houseid = user.house.id;

    res.json({
        success: true,
        user: {
            userid: user.userid,
            username: user.username,
            role: user.role
        }
    });
});

router.post('/logout', async (req, res) => {
    try {
        await req.session.destroy();
        res.clearCookie('connect.sid');
        res.json({ success: true });
    } catch (error) {
        throw new ExpressError('logout failed', 500);
    }
});

router.get('/isLoggedIn', isLoggedIn, (req, res) => {
    res.json({ success: true });
});


module.exports = router;