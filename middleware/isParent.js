const ExpressError = require('../utils/ExpressError');
const User = require('../models/User');

const isParent = async (req, res, next) => {
    if (!req.session || !req.session.username) {
        throw new ExpressError('need to login', 401);
    } else {
        const user = await User.findById(req.session.userid);
        
        if (!user) {
            throw new ExpressError('user not found', 404);
        } else if (user.role != 0) {
            throw new ExpressError('user is not parent', 401);
        } else {
            next();
        }
    }
}

module.exports = isParent;