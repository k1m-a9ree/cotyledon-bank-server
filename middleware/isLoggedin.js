const ExpressError = require('../utils/ExpressError');

const isLoggedin = async (req, res, next) => {
    if (!req.session || !req.session.userid) {
        throw new ExpressError('need to login', 401);
    } else {
        next();
    }
}

module.exports = isLoggedin;