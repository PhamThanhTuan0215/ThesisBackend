const Review = require('../database/models/Review')
const PurchasedProduct = require('../database/models/PurchasedProduct')

module.exports.getReviewByProductId = async (req, res) => {
    try {
        const { product_id } = req.params;

        const reviews = await Review.findAll({
            where: { product_id },
            order: [['modified_at', 'DESC']]
        });

        return res.status(200).json({ code: 0, message: 'Get list review of product successfully', data: reviews });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Get list review of product failed', error: error.message });
    }
}

module.exports.writeReview = async (req, res) => {
    try {
        const { user_id, user_fullname } = req.query;
        const { product_id } = req.params;
        const { rating, comment } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id is required');
        if (!user_fullname || user_fullname === '') errors.push('user_fullname is required');
        if (!rating || isNaN(rating) || rating < 1) errors.push('rating must be a number and greater than or equal to 1');
        if (!comment || comment === '') errors.push('comment is required');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Validation failed', errors });
        }

        const purchasedProduct = await PurchasedProduct.findOne({
            where: {
                user_id,
                product_id
            },
            order: [['updatedAt', 'DESC']]
        })

        if(!purchasedProduct) {
            return res.status(403).json({ code: 1, message: 'You have not purchased this product.' });
        }

        if(purchasedProduct.status !== 'completed') {
            return res.status(403).json({ code: 1, message: 'You have not completed the product purchasing process.' });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 ngày trước
        if (purchasedProduct.updatedAt < thirtyDaysAgo) {
            return res.status(403).json({ code: 1, message: 'You can only review product purchased within the last 30 days.' });
        }

        let review = await Review.findOne({
            where: { user_id, product_id }
        });

        if (review) {
            review.rating = rating;
            review.comment = comment;
            review.user_fullname = user_fullname;
            await review.save();

            return res.status(200).json({ code: 0, message: 'Update review successfully', data: review });
        }
        else {
            review = await Review.create({
                user_id,
                user_fullname,
                product_id,
                rating,
                comment
            });
        }

        return res.status(200).json({ code: 0, message: 'Write review successfully', data: review });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Write review failed', error: error.message });
    }
}

module.exports.deleteReview = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { review_id } = req.params;

        const review = await Review.findByPk(review_id);

        if (!review) {
            return res.status(404).json({ code: 1, message: 'Review not found' });
        }

        if (review.user_id != user_id) {
            return res.status(403).json({ code: 1, message: 'User is not allowed to delete this review' });
        }

        await review.destroy();

        return res.status(200).json({ code: 0, message: 'Delete review successfully', data: review });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Delete review failed', error: error.message });
    }
}

module.exports.deleteReviewByManager = async (req, res) => {
    try {
        const { review_id } = req.params;

        const review = await Review.findByPk(review_id);

        if (!review) {
            return res.status(404).json({ code: 1, message: 'Review not found' });
        }

        await review.destroy();

        return res.status(200).json({ code: 0, message: 'Delete review successfully', data: review });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Delete review failed', error: error.message });
    }
}