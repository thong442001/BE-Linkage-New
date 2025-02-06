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
      var newToken = JWT.sign({ "data": "Thong dep trai wa" }, config.SECRETKEY, { expiresIn: '1d' });
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
      password
    } = req.body;
    const result = await userController.login(
      email,
      phone,
      password
    );
    if (result.status == 200) {
      res.status(200).json({ "status": true, "token": result.token, "refreshToken": result.refreshToken, "user": result.user });
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


//loginWeb  
//http://localhost:3000/user/loginWeb
// router.post('/loginWeb', async function (req, res, next) {
//   try {
//     const body = req.body;
//     const result = await userController.loginWeb(body);
//     if (result.status == 200) {
//       res.status(200).json({ "status": true, "token": result.token, "refreshToken": result.refreshToken, "user": result.user });
//     } else if (result.status == 401) {
//       //sai tài khoản 
//       res.status(401).json({ "status": false, "message": result.message });
//     } else if (result.status == 402) {
//       //sai mật khẩu 
//       res.status(402).json({ "status": false, "message": result.message });
//     } else if (result.status == 403) {
//       //sai mật khẩu 
//       res.status(403).json({ "status": false, "message": result.message });
//     }
//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });

/**
 * @swagger
 * /user/getAllUsers:
 *   get:
 *     security: 
 *       - bearerAuth: []
 *     tags:
 *     - users
 *     summary: Get All Users
 *     responses:
 *       200:
 *         description: list all users
 *       400:
 *         description: lỗi API
 */
//get all
//http://localhost:3000/user/getAllUsers
// router.get('/getAllUsers', checkToken, async function (req, res, next) {
//   try {
//     const list = await userController.getAllUsers();
//     res.status(200).json({ "status": true, "users": list });
//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });

//http://localhost:3000/user/getRoleUser
router.get('/getAllUsers', checkToken, async function (req, res, next) {
  try {
    const list = await userController.getAllUsers();
    res.status(200).json({ "status": true, "users": list });
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});

// //http://localhost:3000/user/getUser
router.get('/getUser', checkToken, async function (req, res, next) {
  try {
    const { userId } = req.query;
    const result = await userController.getUser(userId);
    res.status(200).json({ "status": true, "user": result });
  } catch (e) {
    res.status(400).json({ "status": false, "message": "lỗi" });
  }
});


//get Users DisplayName (search)
//http://localhost:3000/user/getUsersDisplayName
// router.get('/getUsersDisplayName', checkToken, async function (req, res, next) {
//   try {
//     const { displayName } = req.body;
//     const list = await userController.getUsersDisplayName(displayName);
//     res.status(200).json({ "status": true, "users": list });

//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });

/**
 * @swagger
 * /user/edit:
 *   post:
 *     security: 
 *       - bearerAuth: []
 *     tags:
 *     - users
 *     summary: edit user
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *              - avatar
 *              - displayName
 *              - phoneNumber
 *              - birthday
 *            properties:
 *              email:
 *                type: string
 *                default: thong442001@gmail.com 
 *              password:
 *                type: string
 *                default: 123
 *              avatar:
 *                type: string
 *                default: ''
 *              displayName:
 *                type: string
 *                default: ''
 *              phoneNumber:
 *                type: string
 *                default: ''
 *              birthday:
 *                type: string
 *                default: ''
 *     responses:
 *       200:
 *         description: edit thành công và user
 *       400:
 *         description: lỗi API
 *       401:
 *         description: Không tìm thấy user
 */
//edit 
//http://localhost:3000/user/edit
// router.post('/edit', checkToken, async function (req, res, next) {
//   try {
//     const body = req.body;
//     const result = await userController.editUser(body);
//     if (result) {
//       res.status(200).json({ "status": true, "mess": "edit thành công", "user": result });
//     } else {
//       res.status(401).json({ "status": false, "mess": "Không tìm thấy user" });
//     }

//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });


/**
 * @swagger
 * /user/delete:
 *   post:
 *     security: 
 *       - bearerAuth: []
 *     tags:
 *     - users
 *     summary: delete user
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                default: a@gmail.com 
 *     responses:
 *       200:
 *         description: delete thành công
 *       400:
 *         description: lỗi API
 *       401:
 *         description: Không tìm thấy user
 */
//delete
//http://localhost:3000/user/delete
// router.post('/delete', checkToken, async function (req, res, next) {
//   try {
//     const body = req.body;
//     const result = await userController.deleteUser(body);
//     if (result) {
//       res.status(200).json({ "status": true, "mess": "delete thành công" });
//     } else {
//       res.status(401).json({ "status": false, "mess": "Không tìm thấy user" });
//     }

//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });

//chấp nhận lời mời kết bạn
//http://localhost:3000/user/addFriend
// router.post('/addFriend', checkToken, async function (req, res, next) {
//   try {
//     const { friendNotificationId } = req.body;
//     // lấy userId, friendId của friendNotification
//     const twoPeople = await friendNotificationController.getFromAndTo(friendNotificationId);
//     const userId = twoPeople.to;
//     const friendId = twoPeople.from;
//     // xóa friendNotification trong user 
//     const remoteFriendNotificationInUser = await userController.deleteFriendNotificationInUser(userId, friendNotificationId);
//     // xóa friendNotification trong friendNotifications 
//     const result = await friendNotificationController.deleteFriendNotification(friendNotificationId);
//     // add friend in user
//     const user = await userController.addFriendInUser(userId, friendId);
//     // add friend in friend
//     const friend = await userController.addFriendInUser(friendId, userId);
//     res.status(200).json({ "status": true, "mess": "add friend thành công" });

//   } catch (e) {
//     res.status(400).json({ "status": false, "message": "lỗi" });
//   }
// });



module.exports = router;
