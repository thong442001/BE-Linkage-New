const report_post = require("../models/report_post");
const post = require("../models/post");

module.exports = {
    addReport_post,
    getAllReport_post,
    banPost,
    unBanPost,
    getAllBanPost,
}
// reports: [{
//     ID_reason: {
//         type: ObjectId,
//         ref: 'reason',
//         required: true, // bắt buộc phải có
//     },
//     reporters: [{
//         type: ObjectId,
//         ref: 'User',
//         required: true, // bắt buộc phải có
//     }]
// }],
async function addReport_post(me, ID_post, ID_reason) {
    try {
        const report = await report_post.findOne(
            { ID_post: ID_post, status: 'pending' } // Chỉ update nếu status = 'pending'
        );
        if (!report) {
            // tạo mới report_post
            const newItem = {
                reports: [{
                    ID_reason: ID_reason,
                    reporters: [me],
                }],
                ID_post: ID_post,
                status: 'pending',
            };
            await report_post.create(newItem);
        } else {
            // Có rồi thì add me
            const existingReason = report.reports.find(
                r => r.ID_reason.toString() === ID_reason.toString()
            );

            if (existingReason) {
                // Nếu ID_reason đã tồn tại, thêm me vào reporters (nếu chưa có)
                if (!existingReason.reporters.includes(me)) {
                    existingReason.reporters.push(me);
                }
            } else {
                // Nếu ID_reason chưa tồn tại, thêm mới vào mảng reports
                report.reports.push({
                    ID_reason: ID_reason,
                    reporters: [me]
                });
            }

            await report.save();
        }

        return true; // Thành công
    } catch (error) {
        console.error("Lỗi khi báo cáo bài viết:", error);
        throw error;
    }
}

async function getAllReport_post() {
    try {
        // Lấy danh sách report_post và populate dữ liệu cần thiết
        const report_post_list = await report_post.find({ status: false, _destroy: false })
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
            .sort({ "reporters.length": -1 })
            .lean();

        return report_post_list; // Trả về danh sách thay vì `true`
    } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo:", error);
        throw error;
    }
}

async function getAllBanPost() {
    try {
        // Lấy danh sách report_post và populate dữ liệu cần thiết
        const report_post_list = await report_post.find({ status: true, _destroy: false })
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
            .sort({ "reporters.length": -1 })
            .lean();
        // Lọc bỏ những report mà ID_post không có hoặc không phải "Ban"
        const filtered_report_post_list = report_post_list.filter(report => report.ID_post?.type === "Ban");

        return filtered_report_post_list; // Trả về danh sách thay vì `true`
    } catch (error) {
        console.error("Lỗi khi lấy danh sách báo cáo:", error);
        throw error;
    }
}

async function banPost(ID_report_post) {
    try {
        if (!ID_report_post) {
            throw new Error("Thiếu ID của report_post cần khóa.");
        }

        const report = await report_post.findById(ID_report_post);
        report.status = true;
        await report.save();

        const rPost = await post.findById(report.ID_post);
        rPost.type = 'Ban';
        await rPost.save();

        return true;


    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}

async function unBanPost(ID_report_post) {
    try {
        if (!ID_report_post) {
            throw new Error("Thiếu ID của report_post cần mở khóa.");
        }

        const report = await report_post.findById(ID_report_post);

        report._destroy = true;
        await report.save();

        const rPost = await post.findById(report.ID_post);
        if (rPost.ID_post_shared) {
            rPost.type = 'Share';
        } else if (rPost.tags?.length > 0) {
            rPost.type = 'Tag';
        } else {
            rPost.type = 'Normal';
        }
        await rPost.save();

        return true;

    } catch (error) {
        console.error("Lỗi khi xóa báo cáo:", error);
        throw error; // Ném lỗi để xử lý phía trên
    }
}