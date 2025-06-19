const Review = require('../database/models/Review')
const PurchasedProduct = require('../database/models/PurchasedProduct')
const ResponseReview = require('../database/models/ResponseReview')

const sequelize = require('../database/sequelize');

const { uploadFiles, deleteFile } = require('../ultis/manageFilesOnCloudinary')

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const folderPathUpload = 'ecommerce-pharmacy/reviews'

module.exports.uploadCustom = upload.fields([
    { name: 'image_related', maxCount: 10 }
]);

module.exports.getReviewByProductId = async (req, res) => {
    try {
        const { product_id } = req.params;

        const reviews  = await sequelize.query(`
            SELECT 
                r.*,
                rr.id AS response_id,
                rr.*
            FROM reviews r
            LEFT JOIN response_reviews rr ON r.id = rr.review_id
            WHERE r.product_id = :productId
            ORDER BY r."updatedAt" DESC
        `, {
            replacements: { productId: product_id },
            type: sequelize.QueryTypes.SELECT
        });

        // Gom các phản hồi vào từng review
        const grouped = {};

        for (const row of reviews) {
            const reviewId = row.id;

            if (!grouped[reviewId]) {
                grouped[reviewId] = {
                    id: row.id,
                    user_id: row.user_id,
                    seller_id: row.seller_id,
                    order_id: row.order_id,
                    user_fullname: row.user_fullname,
                    product_id: row.product_id,
                    comment: row.comment,
                    rating: row.rating,
                    url_image_related: row.url_image_related,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    response_reviews: null
                };
            }

            if (row.response_id) {
                grouped[reviewId].response_review = {
                    id: row.response_id,
                    review_id: row.review_id,
                    seller_name: row.seller_name,
                    response_comment: row.response_comment,
                    url_image_related: row.url_image_related,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                };
            }
        }

        const result = Object.values(grouped);

        return res.status(200).json({ code: 0, message: 'Lấy danh sách đánh giá của sản phẩm thành công', data: result });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách đánh giá của sản phẩm thất bại', error: error.message });
    }
}

module.exports.writeReview = async (req, res) => {

    let public_id_image_related = null

    try {
        const { user_id, user_fullname } = req.query;
        const { product_id } = req.params;
        const { rating, comment, order_id } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!user_fullname || user_fullname === '') errors.push('user_fullname cần cung cấp');
        if (!rating || isNaN(rating) || rating < 1) errors.push('rating phải là số và lớn hơn hoặc bằng 1');
        if (!comment || comment === '') errors.push('comment cần cung cấp');
        if (!order_id || order_id <= 0) errors.push('order_id cần cung cấp');

        let image_related_file = null;
        let url_image_related = null;

        if (req.files && req.files['image_related']) {
            image_related_file = req.files && req.files['image_related'] && req.files['image_related'][0];
        }

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        if (image_related_file) {
            const filesToUpload = [image_related_file];

            const results = await uploadFiles(filesToUpload, folderPathUpload);

            const result_image_related_file = results[0];

            url_image_related = result_image_related_file.secure_url;

            public_id_image_related = result_image_related_file.public_id;
        }

        const purchasedProduct = await PurchasedProduct.findOne({
            where: {
                user_id,
                product_id,
                order_id
            },
            order: [['updatedAt', 'DESC']]
        })

        if (!purchasedProduct) {
            return res.status(400).json({ code: 1, message: 'Chưa đủ điều kiện để đánh giá sản phẩm' });
        }

        if (purchasedProduct.status !== 'completed') {
            return res.status(400).json({ code: 1, message: 'Chưa hoàn tất quá trình mua sản phẩm' });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 ngày trước
        if (purchasedProduct.updatedAt < thirtyDaysAgo) {
            return res.status(400).json({ code: 1, message: 'Chỉ có thể đánh giá sản phẩm đã mua dưới 30 ngày' });
        }

        let review = await Review.findOne({
            where: { user_id, product_id, order_id }
        });

        if (review) {
            return res.status(400).json({ code: 1, message: 'Đã đánh giá sản phẩm này trong đơn hàng' });
        }
        
        review = await Review.create({
            user_id,
            seller_id: purchasedProduct.seller_id,
            order_id: order_id,
            user_fullname,
            product_id,
            rating,
            comment,
            url_image_related
        });

        return res.status(200).json({ code: 0, message: 'Viết đánh giá thành công', data: review });
    }
    catch (error) {
        if (public_id_image_related) {
            deleteFile(public_id_image_related);
        }

        return res.status(500).json({ code: 2, message: 'Viết đánh giá thất bại', error: error.message });
    }
}

module.exports.updateReview = async (req, res) => {

}

module.exports.deleteReview = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { review_id } = req.params;

        const review = await Review.findByPk(review_id);

        if (!review) {
            return res.status(404).json({ code: 1, message: 'Đánh giá không tồn tại' });
        }

        if (review.user_id != user_id) {
            return res.status(403).json({ code: 1, message: 'Người dùng không được phép xóa đánh giá này' });
        }

        let public_id_image_related = null

        if (review.url_image_related) {
            public_id_image_related = extractFolderFromURL(review.url_image_related) + review.url_image_related.split('/').pop().split('.')[0];
        }

        await review.destroy();

        if (public_id_image_related) {
            deleteFile(public_id_image_related);
        }

        return res.status(200).json({ code: 0, message: 'Xóa đánh giá thành công', data: review });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa đánh giá thất bại', error: error.message });
    }
}

module.exports.deleteReviewByManager = async (req, res) => {
    try {
        const { review_id } = req.params;

        const review = await Review.findByPk(review_id);

        if (!review) {
            return res.status(404).json({ code: 1, message: 'Đánh giá không tồn tại' });
        }

        let public_id_image_related = null

        if (review.url_image_related) {
            public_id_image_related = extractFolderFromURL(review.url_image_related) + review.url_image_related.split('/').pop().split('.')[0];
        }

        await review.destroy();

        if (public_id_image_related) {
            deleteFile(public_id_image_related);
        }

        return res.status(200).json({ code: 0, message: 'Xóa đánh giá thành công', data: review });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa đánh giá thất bại', error: error.message });
    }
}

module.exports.responseReview = async (req, res) => {
    let public_id_image_related = null

    try {
        const { review_id } = req.params;
        const { seller_name, response_comment } = req.body;

        const review = await Review.findByPk(review_id);

        if (!review) {
            return res.status(404).json({ code: 1, message: 'Đánh giá không tồn tại' });
        }

        const existedResponseReview = await ResponseReview.findOne({
            where: { review_id, seller_name }
        });

        if (existedResponseReview) {
            return res.status(400).json({ code: 1, message: 'Phản hồi về đánh giá này đã tồn tại' });
        }

        let image_related_file = null;
        let url_image_related = null;

        if (req.files && req.files['image_related']) {
            image_related_file = req.files && req.files['image_related'] && req.files['image_related'][0];
        }

        if (image_related_file) {
            const filesToUpload = [image_related_file];

            const results = await uploadFiles(filesToUpload, folderPathUpload);

            const result_image_related_file = results[0];

            url_image_related = result_image_related_file.secure_url;

            public_id_image_related = result_image_related_file.public_id;
        }

        const responseReview = await ResponseReview.create({
            review_id,
            seller_name,
            response_comment,
            url_image_related
        });

        return res.status(200).json({ code: 0, message: 'Phản hồi đánh giá thành công', data: responseReview });
    }
    catch (error) {
        if (public_id_image_related) {
            deleteFile(public_id_image_related);
        }

        return res.status(500).json({ code: 2, message: 'Phản hồi đánh giá thất bại', error: error.message });
    }
}

module.exports.updateResponseReview = async (req, res) => {
    let new_public_id_image_related = null

    try {
        const { id } = req.params;
        const { response_comment } = req.body;

        const responseReview = await ResponseReview.findByPk(id);

        if (!responseReview) {
            return res.status(404).json({ code: 1, message: 'Phản hồi đánh giá không tồn tại' });
        }

        if(responseReview.is_edited) {
            return res.status(404).json({ code: 1, message: 'Chỉ cho phép chỉnh sửa phản hồi 1 lần cho mỗi đánh giá' });
        }

        let image_related_file = null;

        if (req.files && req.files['image_related']) {
            image_related_file = req.files && req.files['image_related'] && req.files['image_related'][0];
        }

        let old_public_id_image_related = null;

        if (image_related_file) {

            // Lấy public id trước đó của ảnh
            if (responseReview.url_image_related) {
                old_public_id_image_related = extractFolderFromURL(responseReview.url_image_related) + responseReview.url_image_related.split('/').pop().split('.')[0];
            }

            const filesToUpload = [image_related_file];
            const results = await uploadFiles(filesToUpload, folderPathUpload);

            const result_image_related_file = results[0];

            // cập nhật url mới trong DB
            responseReview.url_image_related = result_image_related_file.secure_url;

            new_public_id_image_related = result_image_related_file.public_id;
        }

        responseReview.response_comment = response_comment;
        responseReview.is_edited = true;
        await responseReview.save();

        if (old_public_id_image_related && new_public_id_image_related) {
            deleteFile(old_public_id_image_related);
        }

        return res.status(200).json({ code: 0, message: 'Cập nhật phản hồi đánh giá thành công', data: responseReview });
    }
    catch (error) {
        if (new_public_id_import_invoice) {
            deleteFile(new_public_id_import_invoice);
        }

        return res.status(500).json({ code: 2, message: 'Cập nhật phản hồi đánh giá thất bại', error: error.message });
    }
}

module.exports.deleteResponseReview = async (req, res) => {

    try {
        const { id } = req.params;

        const responseReview = await ResponseReview.findByPk(id);

        if (!responseReview) {
            return res.status(404).json({ code: 1, message: 'Phản hồi đánh giá không tồn tại' });
        }

        let public_id_image_related = null

        if (responseReview.url_image_related) {
            public_id_image_related = extractFolderFromURL(responseReview.url_image_related) + responseReview.url_image_related.split('/').pop().split('.')[0];
        }

        if(public_id_image_related) {
            deleteFile(public_id_image_related);
        }

        await responseReview.destroy();

        return res.status(200).json({ code: 0, message: 'Xóa phản hồi đánh giá thành công', data: responseReview });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Xóa phản hồi đánh giá thất bại', error: error.message });
    }
}

function extractFolderFromURL(url) {
    // Tách phần sau "upload/" (nếu có)
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return ''; // Không tìm thấy "/upload/", trả về chuỗi rỗng

    // Lấy phần sau "/upload/"
    const path = url.substring(uploadIndex + 8);

    // Loại bỏ tiền tố "v[digits]/" nếu có
    const cleanedPath = path.replace(/^v\d+\//, '');

    // Tìm vị trí của dấu "/" cuối cùng
    const lastSlashIndex = cleanedPath.lastIndexOf('/');

    // Trích xuất toàn bộ path (không có tiền tố "v[digits]/")
    if (lastSlashIndex !== -1) {
        return cleanedPath.substring(0, lastSlashIndex + 1);
    }

    // Nếu không có thư mục
    return ''; // Trả về chuỗi rỗng
}