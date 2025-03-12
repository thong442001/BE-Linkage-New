const report_post = require("../models/report_post");
const post = require("../models/post");

module.exports = {
    addReport_post,
    getAllReport_post,
    deleteReport_post,
}

async function addReport_post(me, ID_post) {
    try {
        const report = await report_post.findOneAndUpdate(
            { ID_post: ID_post, status: false }, // Chỉ update nếu status = false
            {
                $addToSet: { reporters: me }, // Thêm nếu chưa có
                $setOnInsert: { status: false, reporters: [me] } // Nếu tạo mới, thêm luôn `me`
            },
            { upsert: true, new: true } // Tạo mới nếu chưa có, trả về bản ghi mới
        );

        return true; // Thành công
    } catch (error) {
        console.error("Lỗi khi báo cáo bài viết:", error);
        throw error;
    }
}



async function getAllReport_post() {
    try {
        // Lấy danh sách report_post và populate dữ liệu cần thiết
        const reports = await report_post.find({ status: false })
            .populate('reporters', 'first_name last_name avatar')
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
            .sort({ createdAt: -1 })
            .lean();

        return reports; // Trả về danh sách thay vì `true`
    } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo:", error);
        throw error;
    }
}


async function deleteReport_post(_id) {
    try {
        if (!_id) {
            throw new Error("Thiếu ID của report_post cần xóa.");
        }

        const deletedReport = await report_post.findByIdAndDelete(_id);

        if (!deletedReport) {
            console.warn(`Không tìm thấy báo cáo với ID: ${_id}`);
            return false; // Không tìm thấy report
        }

        console.log(`Đã xóa báo cáo với ID: ${_id}`);
        return true;
    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

