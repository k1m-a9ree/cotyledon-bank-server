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

const stockPositive = ['회사 지하에서 금괴를 발견했어요!', '회사에 아이스크림가게가 생겨서 직원들이 힘이 나요!', '초전도체를 개발했어요!', '그냥 주식이 오르고 싶어해요!'];
const stockNegative = ['사장님이 귀찮아서 출근을 안하고 있어요..', '사장님이 떡볶이를 먹으러 도망갔어요..', '회사에 침대가 생겼더니 다들 일은 안하고 자러 가요..', '신입사원이 회사 정문에 비밀번호를 걸고 퇴사했어요..'];
const update = async (req, res, next) => {
    const user = await User.findOne({ userid: req.session.userid });
    if (user.lasttime >= Math.floor(Date.now() / (1000 * 60 * 60))) {
        return next();
    } 
    user.lasttime = Math.floor(Date.now() / (1000 * 60 * 60));
    await user.save();

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
            for (let i = product.lasttime + 12; i <= now; i += 12) {
                const { minChange, maxChange } = finProConfig[product.type];
                const random = ( Math.random() * (maxChange - minChange) ) + minChange;
                const share = product.next;
                const next = Math.floor(product.share[product.share.length-1] + product.share[product.share.length-1] * random);

                product.point = Math.floor(product.point * random + product.point);
                product.share.push(share);
                product.next = next;

                if (product.share[product.share.length-2] <= share) {
                    newNoti.push(`${finProConfig[product.type].korean}의 한 주 당 가격이 올랐습니다.`);
                } else {
                    newNoti.push(`${finProConfig[product.type].korean}의 한 주 당 가격이 떨어졌습니다.`);
                }
                
                if (random > 0) {
                    const randomComment = stockPositive[Math.floor(Math.random() * stockPositive.length)];
                    newNoti.push(`[${finProConfig[product.type].korean}] ${randomComment}`);
                } else {
                    const randomComment = stockNegative[Math.floor(Math.random() * stockNegative.length)];
                    newNoti.push(`[${finProConfig[product.type].korean}] ${randomComment}`);
                }

                if ((i - product.maketime) % finProConfig[product.type].term == 0) {
                    child.point += Math.floor(finProConfig[product.type].dividend * product.point);
                    newNoti.push(`${product.type}의 배당금이 지급되었습니다.`);
                }

                product.lasttime = i;
            }
        } else if (product.type === 'demandDeposit') {
            for (let i = product.lasttime + 12; i <= now; i += 12) {
                product.point += Math.floor(product.point * finProConfig.demandDeposit.interest);
                newNoti.push(`${finProConfig['demandDeposit'].korean}의 이자가 지급되었습니다.`);
                product.lasttime = i;
            }
        }
        
        if (finProConfig[product.type].maturity && now - product.maketime >= finProConfig[product.type].maturity) {
            newNoti.push(`${finProConfig[product.type].korean}의 만기일이 지났습니다. 이자와 함께 돈을 받습니다.`);
            child.point += Math.floor(product.point + (product.point * finProConfig[product.type].interest));
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