var express = require('express');
var router = express.Router();
const authMiddleware = require("../middleware/auth");
const report_post = require("../models/report_post");
const hbs = require('hbs');
const report_userController = require("../controllers/report_userController");

// Định nghĩa helper ở đây
hbs.registerHelper('getMediaType', function (url) {
  //console.log('Checking media type for URL:', url);
  if (!url) return 'unknown'; // Nếu không có URL thì trả về 'unknown'

  // Kiểm tra nếu là hình ảnh
  if (/\.(jpeg|jpg|png|gif|webp)$/i.test(url)) {
    return 'image';
  }

  // Kiểm tra nếu là video
  if (/\.(mp4|mov|avi|wmv|flv|webm)$/i.test(url)) {
    return 'video';
  }

  return 'unknown'; // Nếu không khớp với bất kỳ loại nào
});
hbs.registerHelper('getMediaStyle', function (count, index) {
  if (count === 1) {
    return "single-media";
  } else if (count === 2) {
    return "double-media";
  } else if (count === 3) {
    return index === 0 ? "triple-media-first" : "triple-media-second";
  } else if (count === 4) {
    return "quad-media";
  } else { // 5+ media
    if (index < 2) return "five-plus-media-first-row";
    else if (index === 2) return "five-plus-media-second-row-left";
    else if (index === 3) return "five-plus-media-second-row-middle";
    else return "five-plus-media-second-row-right";
  }
});
// Helper kiểm tra nếu a < b
hbs.registerHelper('lt', function (v1, v2, options) {
  return v1 < v2 ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('gt', function (a, b) {
  return a > b;
});
// Helper kiểm tra nếu a === b
hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

// Helper trừ hai số
hbs.registerHelper('sub', function (a, b) {
  return a - b;
});
hbs.registerHelper('and', function (a, b) {
  return a && b;
});

// router.get("/dashboard", authMiddleware, (req, res) => {
//   res.render("dashboard", { user: req.user });
// });

/* GET home page. */
router.get('/', authMiddleware, async function (req, res, next) {

  // Lấy danh sách report_post và populate dữ liệu cần thiết
  const report_post_list = await report_post.find({ status: false })
    .populate('reporters', 'first_name last_name avatar')
    .populate({
      path: 'ID_post',
      populate: [
        { path: 'ID_user', select: 'first_name last_name avatar' },
        { path: 'tags', select: 'first_name last_name avatar' },
        {
          path: 'ID_post_shared',
          select: '-__v',
          populate: [
            { path: 'ID_user', select: 'first_name last_name avatar' },
            { path: 'tags', select: 'first_name last_name avatar' }
          ]
        }
      ],
      select: '-__v' // Lấy tất cả các thuộc tính trừ __v
    })
    .sort({ "reporters.length": -1 })
    .lean();

  const user = req.cookies.user;// Lấy user từ cookie
  res.render("report_post",
    {
      user: user,
      report_post_list: report_post_list,
      isMiniLogo: false,
    });
  //res.render('loginAdmin', { title: 'Linkage', layout: false });
  //res.render('loginAdmin', { title: 'Linkage' });
  //res.send("Express on Vercel");
});

router.get('/getAllReport_user', authMiddleware, async function (req, res, next) {
  const report_user_list = await report_userController.getAllReport_user();

  const user = req.cookies.user;// Lấy user từ cookie
  res.render("report_user", {
    user: user,
    report_user_list: report_user_list,
    isMiniLogo: false,
    layout: "layout",
  });
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
