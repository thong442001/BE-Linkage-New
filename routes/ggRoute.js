var express = require('express');
const axios = require("axios");
var router = express.Router();
const JWT = require('jsonwebtoken');
const config = require("../config");
const users = require("../models/user");
const bcrypt = require('bcryptjs');
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
// 🔹 Load Service Account JSON (Thay bằng đường dẫn đúng)
const serviceAccount = require("../hamstore-5c2f9-firebase-adminsdk-le25c-680e19f4fa.json");
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
    const { fcmToken, title, body, data } = req.body;
    //const accessToken = await getAccessToken();

    // const response = await axios.post(
    //   `https://fcm.googleapis.com/v1/projects/linkage-9deac/messages:send`, // 🔹 Thay YOUR_PROJECT_ID bằng Firebase Project ID
    //   {
    //     message: {
    //       token: fcmToken,
    //       notification: {
    //         title,
    //         body,
    //       },
    //       data: {
    //         ...data,
    //         click_action: "FLUTTER_NOTIFICATION_CLICK", // Xử lý khi nhấn vào
    //         screen: "Friend", // Màn hình cần mở khi nhấn vào
    //       },
    //     },
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${accessToken}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        screen: "Friend",
      },
    };

    await admin.messaging().send(message);
    //console.log("token1: " + accessToken);
    res.json({ success: true, message: "Thông báo đã được gửi!" });
  } catch (error) {
    console.error("❌ Lỗi khi gửi thông báo FCM:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

//http://localhost:3001/gg/loginGG
router.post('/loginGG', async function (req, res, next) {
  try {
    const { email, name, picture } = req.body;
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
        role: 2,
      };

      // Lưu vào database
      user = await users.create(newItem);
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
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    res.status(400).json({ "status": false, "message": error.message });
  }
});

module.exports = router;



