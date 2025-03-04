var express = require('express');
var router = express.Router();
const authMiddleware = require("../middleware/auth");

// router.get("/dashboard", authMiddleware, (req, res) => {
//   res.render("dashboard", { user: req.user });
// });

/* GET home page. */
router.get('/', authMiddleware, function (req, res, next) {
  res.render("home", { user: req.user });
  //res.render('loginAdmin', { title: 'Linkage', layout: false });
  //res.render('loginAdmin', { title: 'Linkage' });
  //res.send("Express on Vercel");
});

router.get('/user/loginAdmin', function (req, res, next) {
  res.render('loginAdmin', { title: 'Linkage', layout: false });
  //res.send("Express on Vercel");
});

router.get('/logout', function (req, res) {
  res.clearCookie("token"); // Xóa token khỏi cookie
  res.redirect("/user/loginAdmin"); // Chuyển hướng về trang login
});


module.exports = router;
