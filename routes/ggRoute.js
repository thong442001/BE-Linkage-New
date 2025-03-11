var express = require('express');
const axios = require("axios");
var router = express.Router();
const JWT = require('jsonwebtoken');
const config = require("../config");
const users = require("../models/user");
const noti_token = require("../models/noti_token");
const notification = require("../models/notification");
const bcrypt = require('bcryptjs');
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
// 🔹 Load Service Account JSON (Thay bằng đường dẫn đúng)
const serviceAccount = require("../hamstore-5c2f9-firebase-adminsdk-le25c-680e19f4fa.json");
const { notify } = require('.');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hamstore-5c2f9-default-rtdb.firebaseio.com"
});

// 🛠 Hàm lấy Access Token từ Google Cloud
async function getAccessToken() {
  try {
    console.log("-----1")
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    console.log("-----2")
    const client = await auth.getClient();
    console.log("-----3" + client)
    const accessToken = await client.getAccessToken();
    console.log("-----4" + accessToken)
    if (!accessToken.token) {
      throw new Error("Không thể lấy Access Token từ Google Cloud");
    }
    return accessToken.token;
  } catch (error) {
    console.error("❌ Lỗi khi lấy Access Token:", error.message);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
}


// 🚀 API gửi thông báo
//http://localhost:3001/gg/send-notification
router.post('/send-notification', async function (req, res, next) {
  try {
    // ⬅️ Nhận danh sách `fcmTokens` (mảng)
    // ⬅️ Nhận danh sách `ID_noties` (mảng)
    const { fcmTokens, title, body, ID_noties } = req.body;

    if (!Array.isArray(fcmTokens) || fcmTokens.length === 0) {
      return res.status(400).json({ success: false, error: "Danh sách fcmTokens không hợp lệ!" });
    }

    // Tạo danh sách thông báo tương ứng với từng user
    const notifications = await Promise.all(
      ID_noties.map(id =>
        notification.findById(id)
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
          .populate({
            path: 'ID_relationship',
            populate: [
              { path: 'ID_userA', select: 'first_name last_name avatar' },
              { path: 'ID_userB', select: 'first_name last_name avatar' },
            ],
            select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
          })
          .populate({
            path: 'ID_group',
            populate: [
              { path: 'members', select: 'first_name last_name avatar' },
            ],
            select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
          })
          .populate({
            path: 'ID_message',
            populate: [
              { path: 'ID_group', select: '-_v' },
              { path: 'sender', select: 'first_name last_name avatar' },
            ],
            select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
          })
          .populate({
            path: 'ID_comment',
            populate: [
              { path: 'ID_user', select: 'first_name last_name avatar' },
              { path: 'ID_post', select: '-_v' },
            ],
            select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
          })
          .populate({
            path: 'ID_post_reaction',
            populate: [
              { path: 'ID_post', select: '-_v' },
              { path: 'ID_user', select: 'first_name last_name avatar' },
              { path: 'ID_reaction', select: '-_v' },
            ],
            select: '-__v' // Lấy tất cả các thuộc tính trừ __v)
          })
          .lean()
      )
    );

    // Kiểm tra nếu có thông báo nào không tồn tại
    if (notifications.some(noti => !noti)) {
      return res.status(404).json({ success: false, error: "Một hoặc nhiều thông báo không tồn tại!" });
    }

    // Tạo danh sách tin nhắn gửi đi
    const messages = fcmTokens.map((token, index) => ({
      token,
      notification: {
        title,
        body,
      },
      data: {
        notification: JSON.stringify(notifications[index]), // ✅ Mỗi user nhận thông báo tương ứng
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    }));

    // Gửi thông báo cho từng user
    const response = await Promise.all(messages.map(msg => admin.messaging().send(msg)));

    console.log(`📢 Gửi ${response.length} thông báo thành công!`);

    res.json({
      success: true,
      message: `Thông báo đã gửi đến ${response.length} thiết bị!`,
      response,
    });

  } catch (error) {
    console.error("❌ Lỗi khi gửi thông báo FCM:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

//http://localhost:3001/gg/loginGG
router.post('/loginGG', async function (req, res, next) {
  try {
    const { email, name, picture, fcmToken } = req.body;
    // const decodedToken = await admin.auth().verifyIdToken(tokengg);
    // const { email, name, picture } = decodedToken;

    let user = await users.findOne({ "email": email });

    if (!user) {
      // Tách name thành first_name và last_name
      const nameParts = name.split(" ");
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(" "); // Ghép phần còn lại

      // lấy now làm dateOfBirth
      const date = new Date();
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;

      // Tạo password ngẫu nhiên
      const randomPassword = Math.random().toString(36).slice(-8);
      // Mã hóa password
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Tạo đối tượng người dùng mới
      const newItem = {
        first_name,
        last_name,
        dateOfBirth: formattedDate,
        sex: null,
        email: email,  // Nếu email trống, set là null
        phone: null,  // Nếu phone trống, set là null
        password: hashedPassword,
        avatar: picture || null, // avt
        role: 2,// user
      };

      // Lưu vào database
      user = await users.create(newItem);
    } else if (user.role == 2) {

      // check noti_token của user
      const check_noti_token = await noti_token.findOne({ "ID_user": user._id })
      if (check_noti_token) {
        check_noti_token.token = fcmToken;
        await check_noti_token.save();
      } else {
        const newItem = {
          ID_user: user._id,
          token: fcmToken,
        };
        await noti_token.create(newItem);
      }
      //token
      const token = JWT.sign({ id: user._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
      const refreshToken = JWT.sign({ id: user._id }, config.SECRETKEY, { expiresIn: '1y' })
      res.status(200).json({
        "status": true,
        "token": token,
        "refreshToken": refreshToken,
        "user": user
      });
    } else if (user.role == 1) {
      res.status(401).json({
        "status": false,
        "message": "Tài khoản admin không thể vào app"
      });
    } else if (user.role == 0) {
      res.status(402).json({
        "status": false,
        "message": "Tài khoản đã bị khóa"
      });
    }
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    res.status(400).json({ "status": false, "message": error.message });
  }
});

//http://localhost:3001/gg/verify-email
router.get('/verify-email', async function (req, res, next) {
  const { oobCode } = req.query;

  if (!oobCode) {
    return res.status(400).send('Mã xác thực không hợp lệ.');
  }

  try {
    // ✅ Chuyển hướng user đến Firebase để xác thực
    res.redirect(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/setAccountInfo?key=${serviceAccount.apiKey}&oobCode=${oobCode}`);
  } catch (error) {
    res.status(400).send("❌ Lỗi xác thực: " + error.message);
  }
});
//http://localhost:3001/gg/check-email
router.get('/check-email', async function (req, res) {
  const { uid } = req.query;
  try {
    const user = await admin.auth().getUser(uid);
    res.status(200).json({ emailVerified: user.emailVerified });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;



