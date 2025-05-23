const { Server } = require("socket.io");
const axios = require("axios");
const message = require("./models/message");
const user = require("./models/user");
const message_reaction = require("./models/message_reaction");
const group = require("./models/group");
const noti_token = require("./models/noti_token");
const notification = require("./models/notification");
//token
const JWT = require('jsonwebtoken');
const config = require("./config");

// Lưu user online
const onlineUsers = new Map();

// Object để lưu trạng thái sẵn sàng của các user trong từng nhóm
const groupReadyState = new Map(); // key: ID_group, value: { userId: boolean }

// Object để lưu trạng thái xét của các user trong từng nhóm
const groupXetState = new Map(); // key: ID_group, value: { userId: boolean }

// Hàm xáo trộn mảng (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: '*', // Cho phép bất kỳ nguồn nào hoặc chỉ định URL của ứng dụng React Native của bạn
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type'],
        },
        transports: ['websocket', 'polling'],
        // Thêm 'websocket' để tối ưu kết nối
        // Đảm bảo sử dụng polling như phương án thay thế
    });

    // Lắng nghe kết nối từ client
    io.on('connection', (socket) => {

        console.log(`✅ User connected: ${socket.id}`);

        socket.on("join_login_QR", (qrToken) => {
            if (!qrToken) {
                console.error("❌ qrToken ID is missing!");
                return;
            }
            socket.join(qrToken);
            console.log(`👥 User ${socket.id} join_login_QR: ${qrToken}`);
        });

        socket.on('login_QR', async (data) => {
            const { qrToken, ID_user } = data;
            if (!ID_user || !qrToken) return;

            const login_user = await user.findById(ID_user);
            if (login_user) {
                login_user.QR = qrToken;
                await login_user.save();
                //token
                const token = JWT.sign({ id: login_user._id, data: "data ne" }, config.SECRETKEY, { expiresIn: '1d' });
                const refreshToken = JWT.sign({ id: login_user._id }, config.SECRETKEY, { expiresIn: '1y' })
                const paramNew = {
                    user: login_user,
                    token: token,
                    refreshToken: refreshToken,
                }
                io.to(qrToken).emit('lang_nghe_login_QR', paramNew);

            } else {
                console.error("❌ ID_user ko tồn tại!");
                return;
            }
        });

        // Khi user login, lưu vào danh sách online
        socket.on("user_online", async (ID_user) => {
            if (!ID_user) return;

            onlineUsers.set(ID_user, socket.id);
            console.log(`🟢 User ${ID_user} is online`);

            // Cập nhật trạng thái user trong database (không cần đợi)
            user.findByIdAndUpdate(ID_user, { isActive: 2 }).exec();

            // Gửi danh sách ID của user online về tất cả client
            io.emit("online_users", Array.from(onlineUsers.keys()));
        });


        socket.on("joinGroup", (ID_group) => {
            if (!ID_group) {
                console.error("❌ Group ID is missing!");
                return;
            }
            socket.join(ID_group);
            console.log(`👥 User ${socket.id} joined group: ${ID_group}`);
        });

        socket.on('edit_avt_name-group', async (data) => {
            const { ID_group, avatar, name } = data;

            const editGroup = await group.findById(ID_group);

            if (!editGroup) return;

            editGroup.avatar = avatar
                ? avatar
                : editGroup.avatar;
            editGroup.name = name
                ? name
                : editGroup.name;
            await editGroup.save();

            // trong group
            io.to(ID_group).emit('lang_nghe_chat_edit_avt_name_group', editGroup);
            // ngoài home chat
            io.emit('lang_nghe_home_chat_edit_avt_name_group', editGroup);
        })

        socket.on('send_message', async (data) => {
            const { ID_group, sender, content, type, ID_message_reply } = data;
            // Tìm thông tin người gửi từ database
            const checkUser = await user.findById(sender);
            if (checkUser == null) {
                console.log('Không tìm thấy user!');
                return;
            }
            // Lưu tin nhắn vào database
            const newMessage = new message({
                ID_group,
                sender,
                content,
                type,
                ID_message_reply,
                _destroy: false,
            });
            await newMessage.save();

            // Phát lại tin nhắn cho tất cả các client
            const newMessageSocket = {
                _id: newMessage._id,// tạo newMessage trc mới có _id
                ID_group,
                sender,
                content,
                type,
                ID_message_reply,
                first_name: checkUser.first_name,
                last_name: checkUser.last_name,
                avatar: checkUser.avatar,// Thêm avatar
                updatedAt: newMessage.updatedAt,
                createdAt: newMessage.createdAt,// tạo newMessage trc mới có createdAt
                _destroy: newMessage._destroy,
            };
            io.to(ID_group).emit('receive_message', newMessageSocket);

            // Gửi sự kiện thông báo nhóm có tin nhắn mới
            io.emit('new_message', {
                ID_group: ID_group,
                message: {
                    ID_message: newMessage._id,
                    sender: {
                        ID_user: checkUser._id,
                        first_name: checkUser.first_name,
                        last_name: checkUser.last_name,
                        avatar: checkUser.avatar,
                    },
                    content: newMessage.content,
                    type: newMessage.type || type,
                    createdAt: newMessage.createdAt,
                    _destroy: newMessage._destroy,
                }
            });

            // 🔍 Tìm thông tin nhóm
            const groupInfo = await group.findById(ID_group);
            if (!groupInfo) {
                console.log('Không tìm thấy nhóm!');
                return;
            }

            // 📜 Lọc danh sách thành viên (trừ người gửi)
            const memberIds = groupInfo.members
                .map(m => m.toString())
                .filter(id => id !== sender.toString());

            if (memberIds.length === 0) return; // ⛔ Không có ai để gửi thông báo

            // 🔍 Tìm FCM tokens kèm `ID_user`
            const fcmTokens = await noti_token.find({ ID_user: { $in: memberIds } }).select('ID_user tokens');

            // 🛠 Tạo thông báo cho từng thành viên
            const notifications = fcmTokens.map(({ ID_user }) => ({
                ID_message: newMessage._id,
                ID_user: ID_user.toString(),
                type: 'Tin nhắn mới',
            }));

            // 💾 Lưu thông báo vào database
            const createdNotifications = await notification.insertMany(notifications);

            // 🎯 Ghép `token` với `notificationId`
            const notificationMap = createdNotifications.reduce((acc, noti) => {
                acc[noti.ID_user.toString()] = noti._id.toString();
                return acc;
            }, {});

            // 🔥 Tạo danh sách gửi thông báo từng người
            // const messages = fcmTokens
            //     .map(({ ID_user, token }) => ({
            //         token,
            //         notificationId: notificationMap[ID_user.toString()],
            //     }))
            //     .filter(({ token }) => token && token.trim().length > 0); // Lọc token hợp lệ

            const messages = [];
            fcmTokens.forEach(({ ID_user, tokens }) => {
                if (tokens && tokens.length > 0) {
                    tokens.forEach(token => {
                        messages.push({
                            token,
                            notificationId: notificationMap[ID_user.toString()],
                        });
                    });
                }
            });

            if (messages.length === 0) return; // ⛔ Không có dữ liệu hợp lệ

            // 🚀 Gửi từng thông báo riêng lẻ
            await Promise.all(messages.map(({ token, notificationId }) =>
                axios.post(
                    //`http://localhost:3001/gg/send-notification`,
                    `https://linkage.id.vn/gg/send-notification`,
                    {
                        fcmTokens: [token], // Chỉ gửi cho 1 user
                        title: "Thông báo",
                        body: null,
                        ID_noties: [notificationId], // Notification tương ứng
                    })
            ));

        });

        socket.on("typing", ({ ID_group, ID_user }) => {
            io.to(ID_group).emit("user_typing", { ID_group, ID_user });
        });

        socket.on("stop_typing", ({ ID_group, ID_user }) => {
            io.to(ID_group).emit("user_stop_typing", { ID_group, ID_user });
        });
        // game 3 la
        socket.on('moi-choi-game-3-la', async (data) => {
            const { ID_group, me } = data;
            //const { ID_group, me, content, type, ID_message_reply } = data;
            // Tìm thông tin người gửi từ database
            const checkUser = await user.findById(me);
            if (checkUser == null) {
                console.log('Không tìm thấy user!');
                return;
            }
            // Lưu tin nhắn vào database
            const newMessage = new message({
                ID_group,
                sender: me,
                content: 'Game 3 lá',
                type: 'game3la',
                ID_message_reply: null,
                _destroy: false,
            });
            await newMessage.save();

            // Phát lại tin nhắn cho tất cả các client
            const newMessageSocket = {
                _id: newMessage._id,// tạo newMessage trc mới có _id
                ID_group,
                sender: me,
                content: 'Game 3 lá',
                type: 'game3la',
                ID_message_reply: null,
                first_name: checkUser.first_name,
                last_name: checkUser.last_name,
                avatar: checkUser.avatar,// Thêm avatar
                updatedAt: newMessage.updatedAt,
                createdAt: newMessage.createdAt,// tạo newMessage trc mới có createdAt
                _destroy: newMessage._destroy,
            };
            io.to(ID_group).emit('receive_message', newMessageSocket);

            // Gửi sự kiện thông báo nhóm có tin nhắn mới
            io.emit('new_message', {
                ID_group: ID_group,
                message: {
                    ID_message: newMessage._id,
                    sender: {
                        ID_user: checkUser._id,
                        first_name: checkUser.first_name,
                        last_name: checkUser.last_name,
                        avatar: checkUser.avatar,
                    },
                    content: newMessage.content,
                    createdAt: newMessage.createdAt,
                    _destroy: newMessage._destroy,
                }
            });
            io.to(ID_group).emit('lang-nghe-moi-choi-game-3-la', newMessageSocket);

            // 🔍 Tìm thông tin nhóm
            const groupInfo = await group.findById(ID_group);
            if (!groupInfo) {
                console.log('Không tìm thấy nhóm!');
                return;
            }
            // 📜 Lọc danh sách thành viên (trừ người gửi)
            const memberIds = groupInfo.members
                .map(m => m.toString())
                .filter(id => id !== me.toString());
            if (memberIds.length === 0) return; // ⛔ Không có ai để gửi thông báo
            // 🔍 Tìm FCM tokens kèm `ID_user`
            const fcmTokens = await noti_token.find({ ID_user: { $in: memberIds } }).select('ID_user tokens');
            // 🛠 Tạo thông báo cho từng thành viên
            const notifications = fcmTokens.map(({ ID_user }) => ({
                ID_group: ID_group,
                ID_user: ID_user,
                type: 'Mời chơi game 3 lá',
            }));

            // 💾 Lưu thông báo vào database
            const createdNotifications = await notification.insertMany(notifications);

            // 🎯 Ghép `token` với `notificationId`
            const notificationMap = createdNotifications.reduce((acc, noti) => {
                acc[noti.ID_user.toString()] = noti._id.toString();
                return acc;
            }, {});

            const messages = [];
            fcmTokens.forEach(({ ID_user, tokens }) => {
                if (tokens && tokens.length > 0) {
                    tokens.forEach(token => {
                        messages.push({
                            token,
                            notificationId: notificationMap[ID_user.toString()],
                        });
                    });
                }
            });

            if (messages.length === 0) return; // ⛔ Không có dữ liệu hợp lệ

            // 🚀 Gửi từng thông báo riêng lẻ
            await Promise.all(messages.map(({ token, notificationId }) =>
                axios.post(
                    //`http://localhost:3001/gg/send-notification`,
                    `https://linkage.id.vn/gg/send-notification`,
                    {
                        fcmTokens: [token], // Chỉ gửi cho 1 user
                        title: "Thông báo",
                        body: null,
                        ID_noties: [notificationId], // Notification tương ứng
                    })
            ));

        });
        socket.on('chap-nhan-choi-game-3-la', async (data) => {
            // const { ID_group } = data;
            // io.to(ID_group).emit('lang-nghe-chap-nhan-choi-game-3-la');
            const { ID_message, ID_group } = data;
            const messageEdit = await message.findById(ID_message)
            if (messageEdit) {
                // thu hồi
                messageEdit._destroy = true;
                await messageEdit.save();
                console.log("✅ Thu hồi tin nhắn thành công");
            } else {
                console.log("❌ Tin nhắn không tồn tại!");
            }
            const paramNew = {
                ID_message
            }
            io.to(ID_group).emit('message_revoked', paramNew);
            io.to(ID_group).emit('lang-nghe-chap-nhan-choi-game-3-la');
        });
        socket.on('tu-choi-choi-game-3-la', async (data) => {
            // const { ID_group } = data;
            // io.to(ID_group).emit('lang-nghe-tu-choi-choi-game-3-la');
            const { ID_message, ID_group } = data;
            const messageEdit = await message.findById(ID_message)
            if (messageEdit) {
                // thu hồi
                messageEdit._destroy = true;
                await messageEdit.save();
                console.log("✅ Thu hồi tin nhắn thành công");
            } else {
                console.log("❌ Tin nhắn không tồn tại!");
            }
            const paramNew = {
                ID_message
            }
            io.to(ID_group).emit('message_revoked', paramNew);
            io.to(ID_group).emit('lang-nghe-tu-choi-choi-game-3-la');
        });

        // Xử lý bắt đầu game
        socket.on('bat-dau-game-3-la', async (data) => {
            const { ID_group } = data;

            // Tìm thông tin nhóm
            const groupInfo = await group.findById(ID_group).populate('members');
            if (!groupInfo) {
                console.log('Không tìm thấy nhóm!');
                return;
            }
            if (!groupInfo.isPrivate) {
                console.log('Nhóm chat này không phải là private!');
                return;
            }
            if (!groupInfo.members || groupInfo.members.length !== 2) {
                console.log('Nhóm không có đúng 2 thành viên!');
                return;
            }

            // Danh sách các lá bài
            let bo_bai = [
                11, 12, 13, 14,
                21, 22, 23, 24,
                31, 32, 33, 34,
                41, 42, 43, 44,
                51, 52, 53, 54,
                61, 62, 63, 64,
                71, 72, 73, 74,
                81, 82, 83, 84,
                91, 92, 93, 94,
                101, 102, 103, 104,
                111, 112, 113, 114,
                121, 122, 123, 124,
                131, 132, 133, 134
            ];

            // Xáo trộn mảng lá bài
            let rd = shuffleArray(bo_bai);
            let bacaoplayer1 = 0;
            let bacaoplayer2 = 0;
            let winer = 'Hòa';
            let kqplayer1 = '';
            let kqplayer2 = '';

            // Hàm doi
            const doi = (n, m) => {
                let d = Math.floor(n / 10); // Sửa: khai báo biến d
                if (d === 11 || d === 12 || d === 13) {
                    d = 10;
                    m.value += 1;
                }
                return d;
            };

            // Hàm diemtong
            const diemtong = (a, b, c) => {
                let tong = (a + b + c) % 10;
                return tong;
            };

            // Tính điểm cho player 1
            let m1 = { value: 0 };
            const d1 = doi(rd[0], m1);
            const d2 = doi(rd[1], m1);
            const d3 = doi(rd[2], m1);
            bacaoplayer1 = m1.value;
            const diemtongplayer1 = diemtong(d1, d2, d3);

            // Tính điểm cho player 2
            let m2 = { value: 0 };
            const d4 = doi(rd[3], m2);
            const d5 = doi(rd[4], m2);
            const d6 = doi(rd[5], m2);
            bacaoplayer2 = m2.value;
            const diemtongplayer2 = diemtong(d4, d5, d6);

            // Xác định người thắng
            if (bacaoplayer1 === 3 || bacaoplayer2 === 3) {
                if (bacaoplayer1 === 3 && bacaoplayer2 === 3) {
                    winer = "Hòa";
                    kqplayer1 = "⭐️Ba Cao⭐️";
                    kqplayer2 = "⭐️Ba Cao⭐️";
                } else if (bacaoplayer2 === 3) {
                    winer = groupInfo.members[1]._id.toString();
                    kqplayer1 = `${diemtongplayer1} nút`;
                    kqplayer2 = "⭐️Ba Cao⭐️";
                } else {
                    winer = groupInfo.members[0]._id.toString();
                    kqplayer1 = "⭐️Ba Cao⭐️";
                    kqplayer2 = `${diemtongplayer2} nút`;
                }
            } else {
                if (diemtongplayer2 < diemtongplayer1) {
                    winer = groupInfo.members[0]._id.toString();
                    kqplayer1 = `${diemtongplayer1} nút`;
                    kqplayer2 = `${diemtongplayer2} nút`;
                } else if (diemtongplayer2 > diemtongplayer1) {
                    winer = groupInfo.members[1]._id.toString();
                    kqplayer1 = `${diemtongplayer1} nút`;
                    kqplayer2 = `${diemtongplayer2} nút`;
                } else {
                    winer = "Hòa";
                    kqplayer1 = `${diemtongplayer1} nút`;
                    kqplayer2 = `${diemtongplayer2} nút`;
                }
            }

            // Tạo payload để gửi cho client
            const paramNew = {
                img_lung: 'https://firebasestorage.googleapis.com/v0/b/hamstore-5c2f9.appspot.com/o/Linkage-game-3la%2Flung.jpg?alt=media&token=b68b92bf-c1f5-4e62-a706-e960460bdc95',
                player1: {
                    _id: groupInfo.members[0]._id.toString(),
                    diemtong: kqplayer1,
                    cards: [
                        `https://firebasestorage.googleapis.com/v0/b/hamstore-5c2f9.appspot.com/o/Linkage-game-3la%2F${rd[0]}.jpg?alt=media&token=b68b92bf-c1f5-4e62-a706-e960460bdc95`,
                        `https://firebasestorage.googleapis.com/v0/b/hamstore-5c2f9.appspot.com/o/Linkage-game-3la%2F${rd[1]}.jpg?alt=media&token=b68b92bf-c1f5-4e62-a706-e960460bdc95`,
                        `https://firebasestorage.googleapis.com/v0/b/hamstore-5c2f9.appspot.com/o/Linkage-game-3la%2F${rd[2]}.jpg?alt=media&token=b68b92bf-c1f5-4e62-a706-e960460bdc95`,
                    ]
                },
                player2: {
                    _id: groupInfo.members[1]._id.toString(),
                    diemtong: kqplayer2,
                    cards: [
                        `https://firebasestorage.googleapis.com/v0/b/hamstore-5c2f9.appspot.com/o/Linkage-game-3la%2F${rd[3]}.jpg?alt=media&token=b68b92bf-c1f5-4e62-a706-e960460bdc95`,
                        `https://firebasestorage.googleapis.com/v0/b/hamstore-5c2f9.appspot.com/o/Linkage-game-3la%2F${rd[4]}.jpg?alt=media&token=b68b92bf-c1f5-4e62-a706-e960460bdc95`,
                        `https://firebasestorage.googleapis.com/v0/b/hamstore-5c2f9.appspot.com/o/Linkage-game-3la%2F${rd[5]}.jpg?alt=media&token=b68b92bf-c1f5-4e62-a706-e960460bdc95`,
                    ]
                },
                winer: winer
            };

            console.log('Dữ liệu game:', paramNew);
            io.to(ID_group).emit('lang-nghe-bat-dau-game-3la', paramNew);
        });

        // Xử lý khi user sẵn sàng
        socket.on('ss-game-3la', async (data) => {
            const { ID_group, ID_user } = data;

            // Tìm thông tin nhóm
            const groupInfo = await group.findById(ID_group).populate('members');
            if (!groupInfo) {
                console.log('Không tìm thấy nhóm!');
                return;
            }
            if (!groupInfo.isPrivate) {
                console.log('Nhóm chat này không phải là private!');
                return;
            }
            if (!groupInfo.members || groupInfo.members.length !== 2) {
                console.log('Nhóm không có đúng 2 thành viên!');
                return;
            }

            // Khởi tạo trạng thái sẵn sàng cho nhóm nếu chưa có
            if (!groupReadyState.has(ID_group)) {
                groupReadyState.set(ID_group, {});
            }

            // Cập nhật trạng thái sẵn sàng của user
            const readyState = groupReadyState.get(ID_group);
            readyState[ID_user] = true;

            // Kiểm tra xem cả hai user đã sẵn sàng chưa
            const user1Ready = readyState[groupInfo.members[0]._id.toString()] || false;
            const user2Ready = readyState[groupInfo.members[1]._id.toString()] || false;

            if (user1Ready && user2Ready) {
                console.log(`Cả hai user trong nhóm ${ID_group} đã sẵn sàng, bắt đầu game!`);
                groupReadyState.delete(ID_group);

                // Gửi sự kiện bắt đầu game
                io.to(ID_group).emit('lang-nghe-ss-game-3la', { start: true, ID_group });
            } else {
                io.to(ID_group).emit('lang-nghe-ss-game-3la', { start: false, readyUser: ID_user });
            }
        });

        // Xử lý khi user xét bài
        socket.on('xet-game-3la', async (data) => {
            const { ID_group, ID_user } = data;

            console.log(`Nhận xet-game-3la từ user ${ID_user} trong nhóm ${ID_group}`);

            // Tìm thông tin nhóm
            const groupInfo = await group.findById(ID_group).populate('members');
            if (!groupInfo) {
                console.log('Không tìm thấy nhóm!');
                return;
            }
            if (!groupInfo.isPrivate) {
                console.log('Nhóm chat này không phải là private!');
                return;
            }
            if (!groupInfo.members || groupInfo.members.length !== 2) {
                console.log('Nhóm không có đúng 2 thành viên!');
                return;
            }

            // Khởi tạo trạng thái xét bài cho nhóm nếu chưa có
            if (!groupXetState.has(ID_group)) {
                groupXetState.set(ID_group, {});
            }

            // Cập nhật trạng thái xét bài của user
            const xetState = groupXetState.get(ID_group);
            xetState[ID_user] = true;
            console.log(`User ${ID_user} đã xét bài. Trạng thái:`, xetState);

            // Kiểm tra xem cả hai user đã xét bài chưa
            const user1Xet = xetState[groupInfo.members[0]._id.toString()] || false;
            const user2Xet = xetState[groupInfo.members[1]._id.toString()] || false;
            console.log(`User 1 (${groupInfo.members[0]._id.toString()}): ${user1Xet}`);
            console.log(`User 2 (${groupInfo.members[1]._id.toString()}): ${user2Xet}`);

            if (user1Xet && user2Xet) {
                console.log(`Cả hai user trong nhóm ${ID_group} đã xét bài, kết thúc ván!`);
                groupXetState.delete(ID_group);
                io.to(ID_group).emit('lang-nghe-xet-game-3la', { start: true });
            } else {
                io.to(ID_group).emit('lang-nghe-xet-game-3la', { start: false, readyUser: ID_user });
            }
        });

        // 1 user thoát game là đẩy cả 2 user ra khỏi phòng
        socket.on('thoat-choi-game-3-la', async (data) => {
            const { ID_group } = data;
            io.to(ID_group).emit('lang-nghe-thoat-choi-game-3-la', ID_group);
        });

        // call 
        socket.on('chap-nhan-call', async (data) => {
            const { ID_group } = data;
            io.to(ID_group).emit('lang-nghe-chap-nhan-call');
        });
        socket.on('tu-choi-call', async (data) => {
            const { ID_group } = data;
            io.to(ID_group).emit('lang-nghe-tu-choi-call');
        });

        // Xử lý thu hồi tin nhắn
        socket.on('revoke_message', async (data) => {
            const { ID_message, ID_group } = data;
            const messageEdit = await message.findById(ID_message)
            if (messageEdit) {
                // thu hồi
                messageEdit._destroy = true;
                await messageEdit.save();
                console.log("✅ Thu hồi tin nhắn thành công");
            } else {
                console.log("❌ Tin nhắn không tồn tại!");
            }
            const paramNew = {
                ID_message
            }
            io.to(ID_group).emit('message_revoked', paramNew);
        });

        // Xử lý message_reaction
        socket.on('send_message_reaction', async (data) => {
            const { ID_group, ID_message, ID_user, ID_reaction } = data;
            // tìm coi message_reaction có chưa 
            const checkMessage_Reaction = await message_reaction.findOne({
                ID_message: ID_message,
                ID_user: ID_user,
                ID_reaction: ID_reaction
            })
            if (checkMessage_Reaction != null) {
                // nếu có rồi thì tăng quantity
                checkMessage_Reaction.quantity = checkMessage_Reaction.quantity + 1;
                await checkMessage_Reaction.save();
                // Populate lại dữ liệu trước khi gửi
                const populatedReaction = await message_reaction.findById(checkMessage_Reaction._id)
                    .populate('ID_user', 'first_name last_name avatar')
                    .populate('ID_reaction', 'name icon')
                    .lean();
                io.to(ID_group).emit('receive_message_reation', populatedReaction);
            } else {
                // chưa thì tạo
                const newItem = {
                    ID_message,
                    ID_user,
                    ID_reaction,
                };
                const newMessage_Reaction = await message_reaction.create(newItem);
                // Populate lại dữ liệu trước khi gửi
                const populatedMessage_Reaction = await message_reaction.findById(newMessage_Reaction._id)
                    .populate('ID_user', 'first_name last_name avatar')
                    .populate('ID_reaction', 'name icon')
                    .lean();

                io.to(ID_group).emit('receive_message_reation', populatedMessage_Reaction);
            }
        });

        // tạo nhóm
        socket.on("new_group", ({ group, members }) => {
            console.log("📢 Server nhận new_group:", group._id);
            group.messageLatest = group.messageLatest || null;
            members.forEach(memberId => {
                const memberSocket = onlineUsers.get(memberId);
                if (memberSocket) {
                    io.to(memberSocket).emit("new_group", { group, members });
                    console.log(`📡 Gửi new_group đến user ${memberId}`);
                } else {
                    console.log(`⚠️ User ${memberId} offline, không thể gửi socket.`);
                }
            });
        });

        // Xử lý thêm thành viên vào nhóm
        socket.on("add_members", async ({ group, members }) => {
            console.log("📢 Server nhận add_members:", group._id);
            group.messageLatest = group.messageLatest || null;
            // Gửi sự kiện `new_group` đến từng thành viên mới
            members.forEach(memberId => {
                const memberSocket = onlineUsers.get(memberId);
                if (memberSocket) {
                    io.to(memberSocket).emit("new_group", { group, members });
                    console.log(`📡 Gửi thông báo new_group đến user ${memberId}`);
                } else {
                    console.log(`⚠️ User ${memberId} offline, không thể gửi socket.`);
                }
            });
        });


        socket.on("delete_group", async ({ ID_group }) => {
            if (!ID_group) {
                console.error("❌ Group ID is missing!");
                return;
            }

            console.log("delete_group: 1421");

            // Xóa tất cả thành viên khỏi phòng socket
            io.in(ID_group).socketsLeave(ID_group);

            // homeChat
            io.emit("group_deleted", { ID_group });
        });


        socket.on("kick_user", async ({ ID_group, ID_user }) => {
            if (!ID_group || !ID_user) {
                console.error("❌ Thiếu ID_group hoặc ID_user!");
                return;
            }

            // Thông báo cho user bị kick
            const userSocket = onlineUsers.get(ID_user);
            if (userSocket) {
                // Rời khỏi phòng
                io.to(userSocket).socketsLeave(ID_group);
                io.emit("kicked_from_group", { ID_group, ID_user });
            }
        });


        // Khi user logout ngắt kết nối
        socket.on("user_offline", (userId) => {
            console.log(`❌ User offline: ${userId}`);
            onlineUsers = onlineUsers.filter(user => user._id !== userId);
            io.emit("online_users", onlineUsers);
        });

        // Khi user disconnect, xóa khỏi danh sách online
        socket.on("disconnect", async () => {
            const disconnectedUser = [...onlineUsers.entries()].find(([id, socketId]) => socketId === socket.id);

            if (disconnectedUser) {
                const [ID_user] = disconnectedUser;
                onlineUsers.delete(ID_user);
                console.log(`🔴 User ${ID_user} is offline`);

                // Cập nhật trạng thái user trong database (không chặn event loop)
                user.findByIdAndUpdate(ID_user, { isActive: 1 });

                // Gửi danh sách ID user online mới
                io.emit("online_users", Array.from(onlineUsers.keys()));
            }
        });


        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });
    });

    return io;
}

module.exports = setupSocket;