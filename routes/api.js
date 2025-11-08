const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const parentRouter = require('./parent');
const childRouter = require('./child');
const financialProductRouter = require('./financialProduct');
const storeProductRouter = require('./storeProduct');
const workRouter = require('./work');
const notificationRouter = require('./notification');

router.use('/auth', authRouter);

router.use('/parent', parentRouter);

router.use('/child', childRouter);

router.use('/financialProduct', financialProductRouter);

router.use('/storeProduct', storeProductRouter);

router.use('/work', workRouter);

router.use('/notification', notificationRouter);

module.exports = router;