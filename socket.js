const { Server } = require("socket.io");
const axios = require("axios");
const message = require("./models/message");
const user = require("./models/user");
const message_reaction = require("./models/message_reaction");
const group = require("./models/group");
const noti_token = require("./models/noti_token");
const notification = require("./models/notification");

const onlineUsers = new Map(); // Lưu user online

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

        // Khi user login, lưu vào danh sách online
        // Khi user login, lưu vào danh sách online
        socket.on("user_online", async (ID_user) => {
            if (!ID_user) return;

            onlineUsers.set(ID_user, socket.id);
            console.log(`🟢 User ${ID_user} is online`);

            // Cập nhật trạng thái user trong database
            await user.findByIdAndUpdate(ID_user, { isActive: 2 });

            const onlineUserList = await user.find(
                { _id: { $in: Array.from(onlineUsers.keys()) } },
                "_id avatar first_name last_name"
            );

            // Gửi danh sách user online về tất cả client
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
            const fcmTokens = await noti_token.find({ ID_user: { $in: memberIds } }).select('ID_user token');

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
            const messages = fcmTokens
                .map(({ ID_user, token }) => ({
                    token,
                    notificationId: notificationMap[ID_user.toString()],
                }))
                .filter(({ token }) => token && token.trim().length > 0); // Lọc token hợp lệ

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
                io.emit("kicked_from_group", { ID_group });
            }
        });

        // Khi user ngắt kết nối
        // Khi user disconnect, xóa khỏi danh sách online
        socket.on("disconnect", async () => {
            const disconnectedUser = [...onlineUsers.entries()].find(([id, socketId]) => socketId === socket.id);

            if (disconnectedUser) {
                const [ID_user] = disconnectedUser;
                onlineUsers.delete(ID_user);
                console.log(`🔴 User ${ID_user} is offline`);

                // Cập nhật trạng thái trong database
                await user.findByIdAndUpdate(ID_user, { isActive: 1 });

                const onlineUserList = await user.find(
                    { _id: { $in: Array.from(onlineUsers.keys()) } },
                    "_id avatar first_name last_name"
                );

                // Gửi danh sách user online mới
                io.emit("online_users", onlineUserList);
            }
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });
    });

    return io;
}

module.exports = setupSocket;