const JWT = require('jsonwebtoken');
const config = require("../config");

const checkToken = function (req, res, next) {

    const token = req.header("Authorization").split(' ')[1];
    if (token) {
        JWT.verify(token, config.SECRETKEY, async function (err, id) {
            if (err) {
                res.status(403).json({ "status": 403, "err": err });
            } else {
                //xử lý chức năng tương ứng với API
                next();
            }
        });
    } else {
        res.status(401).json({ "status": 401 });
    }

}

module.exports = checkToken;