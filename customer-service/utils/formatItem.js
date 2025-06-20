module.exports.formatItem = (item, product) => {
    return {
        id: item.dataValues.id,
        user_id: item.dataValues.user_id,
        product_id: item.dataValues.product_id,
        quantity: item.dataValues.quantity,
        product_name: product.name,
        product_url_image: product.url_image,
        original_price: product.retail_price,
        price: product.actual_price,
        seller_id: product.seller_id,
        seller_name: product.seller_name,
        stock: product.stock,
        promotion_name: product.promotion_name,
        promotion_value_percent: product.promotion_value_percent,
        promotion_start_date: product.promotion_start_date,
        promotion_end_date: product.promotion_end_date,
        approval_status: product.approval_status,
        active_status: product.active_status,
        platform_active_status: product.platform_active_status
    }
}