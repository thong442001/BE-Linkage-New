//var createError = require('http-errors');
const express = require("express");
const http = require('http');
var path = require('path');
var cookieParser = require('cookie-parser');
const deeplink = require('node-deeplink'); // Thêm node-deeplink
//var logger = require('morgan');
// CORS
var cors = require('cors')

//config mongoose
const mongoose = require("mongoose");
require("./models/user");
require("./models/post");
require("./models/group");
require("./models/message");
require("./models/reaction");
require("./models/message_reaction");
require("./models/relationship");
require("./models/post_reaction");
require("./models/comment");
require("./models/comment_reaction");
require("./models/noti_token");
require("./models/report_post");
require("./models/report_user");
require("./models/notification");
require("./models/reason");
require("./models/storyViewer");
require("./models/phone_otp");
require("./models/gmail_otp");

var indexRouter = require('./routes/index');
//mogo
var userRoute = require('./routes/userRoute');
var postRoute = require('./routes/postRoute');
var groupRoute = require('./routes/groupRoute');
var messageRoute = require('./routes/messageRoute');
var reactionRoute = require('./routes/reactionRoute');
var message_reactionRoute = require('./routes/message_reactionRoute');
var relationshipRoute = require('./routes/relationshipRoute');
var post_reactionRoute = require('./routes/post_reactionRoute');
var commentRoute = require('./routes/commentRoute');
var comment_reactionRoute = require('./routes/comment_reactionRoute');
var ggRoute = require('./routes/ggRoute');
var report_postRoute = require('./routes/report_postRoute');
var report_userRoute = require('./routes/report_userRoute');
var notificationRoute = require('./routes/notificationRoute');
var reasonRoute = require('./routes/reasonRoute');
var storyViewerRoute = require('./routes/storyViewerRoute');
var phone_otpRoute = require('./routes/phone_otpRoute');
var gmail_otpRoute = require('./routes/gmail_otpRoute');

var app = express();

// socket.io
const setupSocket = require("./socket");
const server = http.createServer(app);
const io = setupSocket(server);

// CORS
//app.use(cors())
app.use(cors({
    origin: '*', // Hoặc chỉ định nguồn cụ thể: ['http://localhost:19006', 'https://your-client-url']
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
//app.use(logger('dev'));
app.use(express.json());
// Middleware để phân tích dữ liệu từ form
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'assets')));

// Static files
// app.use(express.static('assets'))
// app.use('/css', express.static(__dirname + 'assets/css'))
// app.use('/js', express.static(__dirname + 'assets/js'))
// app.use('/images', express.static(__dirname + 'assets/images'))
app.use('/css', express.static(path.join(__dirname, 'assets/css')));
app.use('/js', express.static(path.join(__dirname, 'assets/js')));
app.use('/images', express.static(path.join(__dirname, 'assets/images')));

// Auth Css/Jss/Image
// app.use('/auth/css', express.static(__dirname + '/assets/css'))
// app.use('/auth/js', express.static(__dirname + '/assets/js'))
// app.use('/auth/images', express.static(__dirname + '/assets/images'))
app.use('/auth/css', express.static(path.join(__dirname, 'assets/css')));
app.use('/auth/js', express.static(path.join(__dirname, 'assets/js')));
app.use('/auth/images', express.static(path.join(__dirname, 'assets/images')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-config.js');
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// CDN CSS
const CSS_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, { customCssUrl: CSS_URL })
);

// Cấu hình Deep Link
const deepLinkConfig = {
    fallback: 'https://linkage.id.vn', // URL dự phòng cho các nền tảng không hỗ trợ (ví dụ: máy tính để bàn)
    android_package_name: 'com.linkage.app', // Tên gói ứng dụng Android của bạn
    ios_store_link: 'https://apps.apple.com/vn/app/facebook/id284882215?l=vi', // Liên kết App Store của ứng dụng iOS
    title: 'Linkage', // Tiêu đề tùy chọn cho trang HTML trung gian
};

// Tạo endpoint deep link sử dụng node-deeplink
app.get('/deeplink', deeplink(deepLinkConfig));

//connect database
mongoose.connect('mongodb+srv://thong442001:F3WK9R2BOb3cV86h@totnghiep.8wwlj.mongodb.net/Linkage')//link connect vs mongobd
    .then(() => console.log('>>>>>>>>>> DB Connected!!!!!!'))
    .catch(err => console.log('>>>>>>>>> DB Error: ', err));

app.use('/', indexRouter);
//mogo
app.use('/user', userRoute);
app.use('/post', postRoute);
app.use('/group', groupRoute);
app.use('/message', messageRoute);
app.use('/reaction', reactionRoute);
app.use('/message_reaction', message_reactionRoute);
app.use('/relationship', relationshipRoute);
app.use('/post_reaction', post_reactionRoute);
app.use('/comment', commentRoute);
app.use('/comment_reaction', comment_reactionRoute);
app.use('/gg', ggRoute);
app.use('/report_post', report_postRoute);
app.use('/report_user', report_userRoute);
app.use('/notification', notificationRoute);
app.use('/reason', reasonRoute);
app.use('/storyViewer', storyViewerRoute);
app.use('/phone_otp', phone_otpRoute);
app.use('/gmail_otp', gmail_otpRoute);


// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//     next(createError(404));
// });
// // error handler
// app.use(function (err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};

//     // render the error page
//     res.status(err.status || 500);
//     res.render('error');
// });

// socket.io
// // app.listen(3000, () => console.log("Server ready on port 3000."));
// app.get('/', (req, res) => {
//     res.send('Socket.io server is running!');
// }); 


// Khởi động server
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;