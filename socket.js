const { Server } = require("socket.io");
const message = require("./models/message");
const user = require("./models/user");
const message_reaction = require("./models/message_reaction");

const onlineUsers = new Map(); // Lưu user online

// 🛠 Hàm gửi thông báo kết bạn
async function guiThongBao(ID_user, ID_noti) {
    try {

        const check_noti_token = await noti_token.findOne({ "ID_user": ID_user });
        if (!check_noti_token || !check_noti_token.token) return;

        await axios.post(
            //`http://localhost:3001/gg/send-notification`,
            `https://linkage.id.vn/gg/send-notification`,
            {
                fcmToken: check_noti_token.token,
                title: "Thông báo",
                body: null,
                ID_noti: ID_noti,
            },
        );
        return;
    } catch (error) {
        console.error("⚠️ Lỗi khi gửi thông báo FCM:", error.response?.data || error.message);
    }
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

        // Khi user login, lưu vào danh sách online
        socket.on("user_online", async (ID_user) => {
            if (!ID_user) return;

            onlineUsers.set(ID_user, socket.id);
            console.log(`🟢 User ${ID_user} is online`);

            // Cập nhật trạng thái trong database (nếu cần)
            await user.findByIdAndUpdate(ID_user, { isActive: 2 });

            // Phát danh sách user online cho tất cả client
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

        // Khi user ngắt kết nối
        socket.on('disconnect', async () => {
            const ID_user = [...onlineUsers.entries()].find(([key, value]) => value === socket.id)?.[0];

            if (ID_user) {
                onlineUsers.delete(ID_user);
                console.log(`🔴 User ${ID_user} is offline`);

                // Cập nhật trạng thái offline trong database
                await user.findByIdAndUpdate(ID_user, { isActive: 1 });

                // Phát danh sách user online mới
                io.emit("online_users", Array.from(onlineUsers.keys()));
            }
            console.log(`❌ User disconnected: ${socket.id}`);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });
    });

    return io;
}

module.exports = setupSocket;