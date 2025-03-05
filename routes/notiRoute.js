var express = require('express');
const axios = require("axios");
var router = express.Router();
const admin = require("firebase-admin");
const { GoogleAuth } = require("google-auth-library");
// 🔹 Load Service Account JSON (Thay bằng đường dẫn đúng)
const serviceAccount = require("../hamstore-5c2f9-firebase-adminsdk-le25c-8ea648ca65.json");
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
//http://localhost:3001/noti/send-notification
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


module.exports = router;



