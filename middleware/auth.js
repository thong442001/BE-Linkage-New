const jwt = require("jsonwebtoken");
const config = require("../config");
function authMiddleware(req, res, next) {
    const token = req.cookies.token;// Lấy token từ cookie

    if (!token) return res.redirect("/user/loginAdmin"); // Nếu không có token, chuyển về trang login

    try {
        // JWT.verify(token, config.SECRETKEY, async function (err, id) {
        //             if (err) {
        //                 res.status(403).json({ "status": 403, "err": err });
        //             } else {
        //                 //xử lý chức năng tương ứng với API
        //                 next();
        //             }
        //         });
        const decoded = jwt.verify(token, config.SECRETKEY);
        //req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie("token");
        res.redirect("/user/loginAdmin");
    }
}

module.exports = authMiddleware;
