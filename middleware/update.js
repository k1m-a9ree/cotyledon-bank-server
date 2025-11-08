const House = require('../models/House');
const User = require('../models/User');
const Child = require('../models/Child');
const Parent = require('../models/Parent');

const FinancialProduct = require('../models/FinancialProduct');
const StoreProduct = require('../models/StoreProduct');
const Notification = require('../models/Notification');

const ExpressError = require('../utils/ExpressError');

const finProConfig = require('../config/financialProduct');

// ['demandDeposit', 'fixedDeposit', 
// 'flexibleInstallmentSavings', 'fixedInstallmentSavings', 
// 'growthStock', 'dividendStock']
const update = async (req, res, next) => {
    const user = await User.findOne({ userid: req.session.userid });
    if (user.lasttime >= Math.floor(Date.now() / (1000 * 60 * 60))) {
        return next();
    }

    const child = await Child.findOne({ user: user._id });
    const products = await FinancialProduct.find({ child: child._id });

    const now = Math.floor(Date.now() / (1000 * 60 * 60));

    let newNoti = [];

    for (const product of products) {
        if (product.type === 'fixedInstallmentSavings') {
            const maturity = finProConfig.fixedInstallmentSavings.maturity;
            const period = product.period;
            
            let isLack = false;
            for (let i = product.lasttime + 1; i <= (now < product.maketime + maturity ? now : product.maketime + maturity); i++) {
                if (child.point < period) {
                    isLack = true;
                    break;
                } else {
                    child.point -= period;
                    product.point += period;
                    product.lasttime = i;
                    newNoti.push(`${ i - product.maketime }개월 차 정기 적금이 납입되었습니다.`);
                }
            }

            if (isLack) {
                newNoti.push(`기한 내에 납입하지 못하였습니다. 정기적금을 해지합니다.`);
                await product.deleteOne();
                continue;
            }
        } else if (product.type === 'growthStock' || product.type === 'dividendStock') {
            for (let i = product.lasttime + 1; i <= now; i++) {
                const { minChange, maxChange } = finProConfig[product.type];
                const random = ( Math.random() * (maxChange - minChange) ) + minChange;
                const share = Math.floor(product.share[product.share.length-1] + product.share[product.share.length-1] * random);
                product.point = Math.floor(product.point * random + product.point);
                if (random > 0) {
                    newNoti.push(`${finProConfig[product.type].korean}의 한 주 당 가격이 올랐습니다.`);
                } else {
                    newNoti.push(`${finProConfig[product.type].korean}의 한 주 당 가격이 떨어졌습니다.`);
                }
                product.share.push(share);
                if ((i - product.maketime) % finProConfig[product.type].term == 0) {
                    child.point += Math.floor(finProConfig[product.type].dividend * product.point);
                    newNoti.push(`${product.type}의 배당금이 지급되었습니다.`);
                }
            }
            product.lasttime = now;
        }
        
        if (finProConfig[product.type].maturity && now - product.maketime >= finProConfig[product.type].maturity) {
            newNoti.push(`${finProConfig[product.type].korean}의 만기일이 지났습니다. 이자와 함께 돈을 받습니다.`);
            child.point += product.point + (product.point * finProConfig[product.type].interest);
            await product.deleteOne();
            continue;
        }

        product.save();
    }

    await Notification.insertMany(newNoti.map((e) => ({
        user: user,
        content: e
    })));

    await child.save();

    next();
}

module.exports = update;