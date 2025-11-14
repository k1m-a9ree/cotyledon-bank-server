const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Notification = require('../models/Notification');
const ExpressError = require('../utils/ExpressError');
const isLoggedIn = require('../middleware/isLoggedin');
const update = require('../middleware/update');

router.get('/', isLoggedIn, update, async (req, res) => {
    const user = await User.findOne({ userid: req.session.userid });
    const notifications = await Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(15);

    res.json({
        success: true,
        notifications: notifications.map(n => ({
            id: n._id,
            content: n.content,
            createdAt: n.createdAt
        }))
    });
});


router.delete('/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
        throw new ExpressError('해당 알림을 찾을 수 없습니다.', 404);
    }

    const user = await User.findOne({ userid: req.session.userid });
    if (!user.equals(notification.user)) {
        throw new ExpressError('이 알림을 삭제할 권한이 없습니다.', 403);
    }

    await notification.deleteOne();

    res.json({ success: true });
});

module.exports = router;
