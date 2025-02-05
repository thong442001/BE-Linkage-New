const { Server } = require("socket.io");
const message = require("./models/message");
const user = require("./models/user");
const message_reaction = require("./models/message_reaction");

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
                createdAt: Date.now(),
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
                displayName: checkUser.displayName,  // Thêm tên hiển thị
                avatar: checkUser.avatar,            // Thêm avatar
                createdAt: newMessage.createdAt,// tạo newMessage trc mới có createdAt
                _destroy: newMessage._destroy,
            };
            io.to(newMessageSocket.ID_group).emit('receive_message', newMessageSocket);
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
                    .populate('ID_user', 'displayName avatar')
                    .populate('ID_reaction', 'name icon')
                    .lean();
                io.to(ID_group).emit('receive_message_reation', populatedReaction);
            } else {
                // chưa thì tạo
                const newItem = {
                    ID_message,
                    ID_user,
                    ID_reaction,
                    createdAt: Date.now(),
                };
                const newMessage_Reaction = await message_reaction.create(newItem);
                // Populate lại dữ liệu trước khi gửi
                const populatedMessage_Reaction = await message_reaction.findById(newMessage_Reaction._id)
                    .populate('ID_user', 'displayName avatar')
                    .populate('ID_reaction', 'name icon')
                    .lean();

                io.to(ID_group).emit('receive_message_reation', populatedMessage_Reaction);
            }
        });


        // Ngắt kết nối
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.id}`);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });
    });

    return io;
}

module.exports = setupSocket;