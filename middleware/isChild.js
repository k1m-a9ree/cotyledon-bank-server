const ExpressError = require('../utils/ExpressError');
const User = require('../models/User');

const isChild = async (req, res, next) => {
    if (!req.session || !req.session.userid) {
        throw new ExpressError('need to login', 401);
    } else {
        const user = await User.findOne({ userid: req.session.userid });
        
        if (!user) {
            throw new ExpressError('user not found', 404);
        } else if (user.role != 1) {
            throw new ExpressError('user is not child', 401);
        } else {
            next();
        }
    }
}

module.exports = isChild;