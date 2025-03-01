var express = require('express');
const axios = require("axios");
var router = express.Router();
const { GoogleAuth } = require("google-auth-library");
// 🔹 Load Service Account JSON (Thay bằng đường dẫn đúng)
const serviceAccount = require("../linkage-9deac-firebase-adminsdk-fbsvc-48fc1aff81.json");

// 🛠 Hàm lấy Access Token từ Google Cloud
async function getAccessToken() {
  try {
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
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
    const accessToken = await getAccessToken();

    //console.log("token3: " + accessToken);
    const response = await axios.post(
      `https://fcm.googleapis.com/v1/projects/linkage-9deac/messages:send`, // 🔹 Thay YOUR_PROJECT_ID bằng Firebase Project ID
      {
        message: {
          token: fcmToken,
          notification: {
            title,
            body,
          },
          data: {
            ...data,
            click_action: "FLUTTER_NOTIFICATION_CLICK", // Xử lý khi nhấn vào
            screen: "Friend", // Màn hình cần mở khi nhấn vào
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    //console.log("token1: " + accessToken);
    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error("❌ Lỗi khi gửi thông báo FCM:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});


module.exports = router;



