var express = require('express');
var router = express.Router();

const userController = require("../controllers/userController");
//const friendNotificationController = require("../controllers/friendNotificationController")

//token
const JWT = require('jsonwebtoken');
const config = require("../config");
//checkToken
const checkToken = require("./checkToken");

/**
 * @swagger
 * /user/refreshToken:
 *   post:
 *     tags:
 *     - refreshToken
 *     summary: refreshToken
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - refreshToken
 *            properties:
 *              refreshToken:
 *                type: string
 *                default: "" 
 *     responses:
 *       200:
 *         description: newToken
 *       401:
 *         description: err 
 */
//refreshToken
//http://localhost:3000/user/refreshToken
router.post("/refreshToken", async function (req, res, next) {
  const { refreshToken } = req.body;

  JWT.verify(refreshToken, config.SECRETKEY, async function (err) {
    if (err) {
      res.status(401).json({ err: err });
    } else {
      var newToken = JWT.sign({ "data": "Thong dep trai wa" }, config.SECRETKEY, { expiresIn: '1y' });
      res.status(200).json({ token: newToken });
    }
  });

});

/**
 * @swagger
 * /user/addUser:
 *   post:
 *     tags:
 *     - users
 *     summary: Đăng kí
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *              - displayName
 *            properties:
 *              email:
 *                type: string
 *                default: a@gmail.com
 *              password:
 *                type: string
 *                default: 123456
 *              displayName:
 *                type: string
 *                default: Nguyen Van A
 *     responses:
 *       200:
 *         description: Đăng kí thành công
 *       400:
 *         description: lỗi API
 *       401:
 *         description: Tài khoản đã tồn tại
 */
//addUser  
//http://localhost:3000/user/addUser
router.post('/addUser', async function (req, res, next) {
  try {
    const {
      first_name,
      last_name,
      dateOfBirth,
      sex,
      email,
      phone,
      password
    } = req.body;
    const result = await userController.addUser(
      first_name,
      last_name,
      dateOfBirth,
      sex,
      email,
      phone,
      password
    );

    if (result) {
      res.status(200).json({ "status": true, "message": "Đăng kí thành công" });
    } else {
      res.status(401).json({ "status": false, "message": "Tài khoản đã tồn tại" });
    }

  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

/**
 * @swagger
 * /user/loginApp:
 *   post:
 *     tags:
 *     - users
 *     summary: Đăng Nhập
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                default: admin 
 *              password:
 *                type: string
 *                default: 123456
 *     responses:
 *       200:
 *         description: Đăng kí thành công
 *       400:
 *         description: lỗi API
 *       401:
 *         description: sai tài khoản
 *       402:
 *         description: sai mật khẩu
 */
//loginApp  
//http://localhost:3000/user/loginApp
router.post('/login', async function (req, res, next) {
  try {
    const {
      email,
      phone,
      password,
      fcmToken
    } = req.body;
    const result = await userController.login(
      email,
      phone,
      password,
      fcmToken
    );
    if (result.status == 200) {
      res.status(200).json({ "status": true, "token": result.token, "refreshToken": result.refreshToken, "user": result.user });
    } else if (result.status == 401) {
      //sai tài khoản 
      res.status(401).json({ "status": false, "message": result.message });
    } else if (result.status == 402) {
      //sai mật khẩu 
      res.status(402).json({ "status": false, "message": result.message });
    } else if (result.status == 403) {
      //Tài khoản admin không thể vào app
      res.status(403).json({ "status": false, "message": result.message });
    } else if (result.status == 404) {
      //Tài khoản này đã bị khóa
      res.status(404).json({ "status": false, "message": result.message });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//login admin
//http://localhost:3000/user/loginAdmin
router.post('/loginAdmin', async function (req, res, next) {
  try {
    const {
      username,
      password,
    } = req.body;

    // Kiểm tra nếu nhập vào là số điện thoại
    const isPhoneNumber = /^(84|0[3|5|7|8|9])[0-9]{8}$/.test(username);

    let email = isPhoneNumber ? '' : username;
    let phone = isPhoneNumber ? username : '';

    const result = await userController.loginAdmin(
      email,
      phone,
      password,
    );
    if (result.status == 200) {
      // Lưu token vào cookie
      res.cookie("token", result.token, { httpOnly: true, maxAge: 3600000 });
      res.cookie("user", result.user, { httpOnly: true, maxAge: 3600000 });
      // Chuyển hướng về trang chủ
      res.redirect("/");

      //res.status(200).json({ "status": true, "token": result.token, "refreshToken": result.refreshToken, "user": result.user });
    } else if (result.status == 401) {
      //sai tài khoản 
      res.status(401).json({ "status": false, "message": result.message });
    } else if (result.status == 402) {
      //sai mật khẩu 
      res.status(402).json({ "status": false, "message": result.message });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});
// http://localhost:3000/post/getMyPosts
router.get('/checkEmail', async function (req, res, next) {
  try {
    const { email } = req.query;
    const check = await userController.checkEmail(email);
    if (check) {
      res.status(200).json({ "status": false, "message": "Email đã tồn tại" });
    } else {
      res.status(200).json({ "status": true, "message": "Email chưa tồn tại" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});
// http://localhost:3000/post/checkPhone
router.get('/checkPhone', async function (req, res, next) {
  try {
    const { phone } = req.query;
    const check = await userController.checkPhone(phone);
    if (check) {
      res.status(200).json({ "status": false, "message": "phone đã tồn tại" });
    } else {
      res.status(200).json({ "status": true, "message": "phone chưa tồn tại" });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi API" });
  }
});


//http://localhost:3000/user/getRoleUser
router.get('/getAllUsers', checkToken, async function (req, res, next) {
  try {
    const list = await userController.getAllUsers();
    res.status(200).json({ "status": true, "users": list });
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/user/editNameOfUser
router.post('/editNameOfUser', async function (req, res, next) {
  try {
    const {
      ID_user,
      first_name,
      last_name
    } = req.body;
    const result = await userController.editNameOfUser(
      ID_user,
      first_name,
      last_name
    );
    if (result) {
      return res.status(200).json({
        "status": result,
        message: "Đổi name thành công"
      });
    } else {
      return res.status(401).json({
        "status": result,
        message: "Đổi name thất bại"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/user/editAvatarOfUser
router.post('/editAvatarOfUser', async function (req, res, next) {
  try {
    const {
      ID_user,
      avatar,
    } = req.body;
    const result = await userController.editAvatarOfUser(
      ID_user,
      avatar,
    );
    if (result) {
      return res.status(200).json({
        "status": result,
        message: "Đổi avatar thành công"
      });
    } else {
      return res.status(401).json({
        "status": result,
        message: "Đổi avatar thất bại"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/user/editBackgroundOfUser
router.post('/editBackgroundOfUser', async function (req, res, next) {
  try {
    const {
      ID_user,
      background,
    } = req.body;
    const result = await userController.editBackgroundOfUser(
      ID_user,
      background,
    );
    if (result) {
      return res.status(200).json({
        "status": result,
        message: "Đổi background thành công"
      });
    } else {
      return res.status(401).json({
        "status": result,
        message: "Đổi background thất bại"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});


//http://localhost:3000/user/editPasswordOfUser
router.post('/editPasswordOfUser', async function (req, res, next) {
  try {
    const {
      ID_user,
      passwordOLd,
      passwordNew,
    } = req.body;
    const result = await userController.editPasswordOfUser(
      ID_user,
      passwordOLd,
      passwordNew,
    );
    if (result) {
      return res.status(200).json({
        "status": result,
        message: "Đổi password thành công"
      });
    } else {
      return res.status(201).json({
        "status": result,
        message: "Sai mật khẩu cũ"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/user/setNoti_token
router.post('/setNoti_token', async function (req, res, next) {
  try {
    const {
      ID_user,
      fcmToken
    } = req.body;
    const result = await userController.setNoti_token(
      ID_user,
      fcmToken
    );
    if (result) {
      return res.status(200).json({
        "status": result,
        message: "set noti_token null thành công"
      });
    } else {
      return res.status(401).json({
        "status": result,
        message: "Ko tìm thấy ID_user"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// //http://localhost:3000/user/checkBanUser
router.get('/checkBanUser', checkToken, async function (req, res, next) {
  try {
    const { ID_user } = req.query;
    const result = await userController.checkBanUser(ID_user);
    if (result) {
      res.status(200).json({ "status": true });
    } else {
      res.status(401).json({ "status": false });
    }

  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/user/editBioOfUser
router.post('/editBioOfUser', async function (req, res, next) {
  try {
    const {
      ID_user,
      bio
    } = req.body;
    const result = await userController.editBioOfUser(
      ID_user,
      bio
    );
    if (result) {
      return res.status(200).json({
        "status": result,
        message: "Đổi bio thành công"
      });
    } else {
      return res.status(401).json({
        "status": result,
        message: "Lỗi"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});


//http://localhost:3000/user/quenMatKhau_phone
router.post('/quenMatKhau_phone', async function (req, res, next) {
  try {
    const {
      phone,
      passwordNew,
    } = req.body;
    const result = await userController.quenMatKhau_phone(
      phone,
      passwordNew,
    );
    if (result) {
      return res.status(200).json({
        "status": result,
        message: "Đổi password thành công"
      });
    } else {
      return res.status(401).json({
        "status": result,
        message: "User không tồn tại"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/user/quenMatKhau_gmail
router.post('/quenMatKhau_gmail', async function (req, res, next) {
  try {
    const {
      gmail,
      passwordNew,
    } = req.body;
    const result = await userController.quenMatKhau_gmail(
      gmail,
      passwordNew,
    );
    if (result) {
      return res.status(200).json({
        "status": result,
        message: "Đổi password thành công"
      });
    } else {
      return res.status(401).json({
        "status": result,
        message: "User không tồn tại"
      });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

//http://localhost:3000/user/loginWeb
router.post('/loginWeb', async function (req, res, next) {
  try {
    const {
      email,
      phone,
      password,
    } = req.body;
    const result = await userController.loginWeb(
      email,
      phone,
      password,
    );
    if (result.status == 200) {
      res.status(200).json({ "status": true, "token": result.token, "refreshToken": result.refreshToken, "user": result.user });
    } else if (result.status == 401) {
      //sai tài khoản 
      res.status(401).json({ "status": false, "message": result.message });
    } else if (result.status == 402) {
      //sai mật khẩu 
      res.status(402).json({ "status": false, "message": result.message });
    } else if (result.status == 403) {
      //Tài khoản admin không thể vào app
      res.status(403).json({ "status": false, "message": result.message });
    } else if (result.status == 404) {
      //Tài khoản này đã bị khóa
      res.status(404).json({ "status": false, "message": result.message });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// //http://localhost:3000/user/getUser
router.get('/getUser', checkToken, async function (req, res, next) {
  try {
    const { ID_user } = req.query;
    const result = await userController.getUser(ID_user);
    if (result) {
      res.status(200).json({ "status": true, "user": result });
    }
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

module.exports = router;
