const Voucher = require('../database/models/Voucher')
const VoucherUsage = require('../database/models/VoucherUsage')
const { Op } = require('sequelize')
const sequelize = require('../database/sequelize');

module.exports.getPlatformAvailableVouchers = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { type } = req.query;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucherUsages = await VoucherUsage.findAll({
            where: {
                user_id: user_id,
                is_applied: true
            },
            attributes: ['voucher_id']
        });

        const voucherIds = voucherUsages.map(voucherUsage => voucherUsage.voucher_id);

        const conditions = {
            issuer_type: 'platform',
            start_date: {
                [Op.lte]: new Date()
            },
            end_date: {
                [Op.gte]: new Date()
            },
            is_active: true,
            id: {
                [Op.notIn]: voucherIds
            }
        }

        if (type) conditions.type = type;

        const vouchers = await Voucher.findAll({
            where: conditions,
            attributes: ['id', 'code', 'type', 'description', 'issuer_id', 'discount_value', 'discount_unit', 'min_order_value', 'max_discount_value', 'end_date'],
            order: [
                ['updatedAt', 'DESC']
            ]
        });

        const vouchersByType = {
            order: [],
            freeship: []
        };

        vouchers.forEach(voucher => {
            vouchersByType[voucher.type].push(voucher);
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách voucher khả dụng của sàn thành công', data: vouchersByType });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách voucher khả dụng của sàn thất bại', error: error.message });
    }
}

module.exports.getShopAvailableVouchers = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { type } = req.query;
        const { seller_id } = req.params;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!seller_id || seller_id <= 0) errors.push('seller_id cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucherUsages = await VoucherUsage.findAll({
            where: {
                user_id: user_id,
                is_applied: true
            },
            attributes: ['voucher_id']
        });

        const voucherIds = voucherUsages.map(voucherUsage => voucherUsage.voucher_id);

        const conditions = {
            issuer_type: 'shop',
            start_date: {
                [Op.lte]: new Date()
            },
            end_date: {
                [Op.gte]: new Date()
            },
            is_active: true,
            issuer_id: seller_id,
            id: {
                [Op.notIn]: voucherIds
            }
        }

        if (type) conditions.type = type;

        const vouchers = await Voucher.findAll({
            where: conditions,
            attributes: ['id', 'code', 'type', 'description', 'issuer_id', 'discount_value', 'discount_unit', 'min_order_value', 'max_discount_value', 'end_date'],
            order: [
                ['updatedAt', 'DESC']
            ]
        });

        const vouchersByType = {
            order: [],
            freeship: []
        };

        vouchers.forEach(voucher => {
            vouchersByType[voucher.type].push(voucher);
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách voucher khả dụng của cửa hàng thành công', data: vouchersByType });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách voucher khả dụng của cửa hàng thất bại', error: error.message });
    }
}

module.exports.getAvailableVouchersOfManyShops = async (req, res) => {
    try {
        const { user_id } = req.query;
        const { type } = req.query;
        const { list_seller_ids } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!list_seller_ids || !Array.isArray(list_seller_ids)) errors.push('list_seller_ids cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucherUsages = await VoucherUsage.findAll({
            where: {
                user_id: user_id,
                is_applied: true
            },
            attributes: ['voucher_id']
        });

        const voucherIds = voucherUsages.map(voucherUsage => voucherUsage.voucher_id);

        const conditions = {
            issuer_type: 'shop',
            start_date: {
                [Op.lte]: new Date()
            },
            end_date: {
                [Op.gte]: new Date()
            },
            is_active: true,
            id: {
                [Op.notIn]: voucherIds
            },
            issuer_id: {
                [Op.in]: list_seller_ids
            }
        }

        if (type) conditions.type = type;

        const vouchers = await Voucher.findAll({
            where: conditions,
            attributes: ['id', 'code', 'type', 'description', 'issuer_id', 'discount_value', 'discount_unit', 'min_order_value', 'max_discount_value', 'end_date'],
            order: [
                ['updatedAt', 'DESC']
            ]
        });

        const vouchersByShop = {};

        list_seller_ids.forEach(seller_id => {
            vouchersByShop[seller_id] = {
                order: [],
                freeship: []
            };
        });

        vouchers.forEach(voucher => {
            const seller_id = voucher.issuer_id;
            if(vouchersByShop[seller_id]) {
                vouchersByShop[seller_id][ voucher.type].push(voucher);
            }
        });

        return res.status(200).json({ code: 0, message: 'Lấy danh sách voucher khả dụng của các cửa hàng thành công', data: vouchersByShop });
        
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy danh sách voucher khả dụng của các cửa hàng thất bại', error: error.message });
    }
}

module.exports.applyPlatformVoucher = async (req, res) => {

    try {
        const { apply_type } = req.query;
        const { user_id, stores, voucher_code } = req.body;

        const errors = [];

        if (!apply_type || apply_type === '') errors.push('apply_type cần cung cấp');
        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!stores || !Array.isArray(stores)) errors.push('stores cần cung cấp');
        if (!voucher_code || voucher_code === '') errors.push('voucher_code cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucher = await Voucher.findOne({
            where: {
                code: voucher_code,
                type: apply_type,
                issuer_type: 'platform',
                start_date: {
                    [Op.lte]: new Date()
                },
                end_date: {
                    [Op.gte]: new Date()
                },
                is_active: true
            }
        });

        if (!voucher) {
            return res.status(400).json({ code: 1, message: 'Voucher không hợp lệ' });
        }

        const voucherUsages = await VoucherUsage.findAll({
            where: {
                user_id: user_id,
                is_applied: true
            },
            attributes: ['voucher_id']
        });

        const voucherIds = voucherUsages.map(voucherUsage => voucherUsage.voucher_id);

        if (voucherIds.includes(String(voucher.id))) {
            return res.status(400).json({ code: 1, message: 'Bạn đã sử dụng voucher này' });
        }

        const items_total_before_platform_discount = stores.reduce((total, store) => total + store.items_total_after_discount, 0);
        const shipping_fee_before_platform_discount = stores.reduce((total, store) => total + store.shipping_fee_after_discount, 0);

        if (voucher.min_order_value && items_total_before_platform_discount < voucher.min_order_value) {
            return res.status(400).json({ code: 1, message: 'Đơn hàng không đạt điều kiện sử dụng voucher', note: `Mua thêm ${voucher.min_order_value - items_total_before_platform_discount}đ để sử dụng voucher` });
        }

        let discount_amount_items_platform = 0;
        let discount_amount_shipping_platform = 0;

        let items_total_after_platform_discount = items_total_before_platform_discount;
        let shipping_fee_after_platform_discount = shipping_fee_before_platform_discount;

        if (voucher.type === 'order') {

            const discount_value = parseFloat(voucher.discount_value);

            if (voucher.discount_unit === 'amount') {
                discount_amount_items_platform = discount_value;
            }
            else if (voucher.discount_unit === 'percent') {
                discount_amount_items_platform = items_total_before_platform_discount * discount_value / 100;
            }

            if (voucher.max_discount_value && discount_amount_items_platform > parseFloat(voucher.max_discount_value)) {
                discount_amount_items_platform = parseFloat(voucher.max_discount_value);
            }

            if (discount_amount_items_platform > items_total_before_platform_discount) {
                discount_amount_items_platform = items_total_before_platform_discount;
            }

            items_total_after_platform_discount = items_total_before_platform_discount - discount_amount_items_platform;

            if (items_total_after_platform_discount < 0) {
                items_total_after_platform_discount = 0;
            }

        }
        else if (voucher.type === 'freeship') {

            const discount_value = parseFloat(voucher.discount_value);

            if (voucher.discount_unit === 'amount') {
                discount_amount_shipping_platform = discount_value;
            }
            else if (voucher.discount_unit === 'percent') {
                discount_amount_shipping_platform = shipping_fee_before_platform_discount * discount_value / 100;
            }

            if (voucher.max_discount_value && discount_amount_shipping_platform > parseFloat(voucher.max_discount_value)) {
                discount_amount_shipping_platform = parseFloat(voucher.max_discount_value);
            }

            if (discount_amount_shipping_platform > shipping_fee_before_platform_discount) {
                discount_amount_shipping_platform = shipping_fee_before_platform_discount;
            }

            shipping_fee_after_platform_discount = shipping_fee_before_platform_discount - discount_amount_shipping_platform;

            if (shipping_fee_after_platform_discount < 0) {
                shipping_fee_after_platform_discount = 0;
            }
        }

        // Tạo thêm thông tin của mỗi shop về việc chịu ảnh hưởng của voucher sàn, trong đó chứa thông tin voucher sàn cùng tỉ lệ phân chia giá trị voucher sàn cho từng shop
        const platform_voucher_allocates_to_stores = stores.map(store => {
            const store_items_total = store.items_total_after_discount || 0;
            const store_shipping_fee = store.shipping_fee_after_discount || 0;

            let allocated_discount_amount = 0; // giá trị voucher sàn phân chia cho từng shop
            let base_total = 0; // tổng tiền hàng hoặc phí ship sau khi áp dụng voucher của tất cả các shop (trước khi áp dụng voucher sàn)

            if (voucher.type === 'order') {
                base_total = items_total_before_platform_discount;
                allocated_discount_amount = base_total > 0 ? (store_items_total / base_total) * discount_amount_items_platform : 0;
            } else if (voucher.type === 'freeship') {
                base_total = shipping_fee_before_platform_discount;
                allocated_discount_amount = base_total > 0 ? (store_shipping_fee / base_total) * discount_amount_shipping_platform : 0;
            }

            return {
                store_id: store.seller_id,
                voucher_id: voucher.id,
                type: voucher.type,
                allocated_discount_amount: Math.round(allocated_discount_amount) // làm tròn cho dễ quản lý
            };
        })

        const data = {
            items_total_before_platform_discount,
            shipping_fee_before_platform_discount,
            discount_amount_items_platform,
            discount_amount_shipping_platform,
            items_total_after_platform_discount,
            shipping_fee_after_platform_discount,
            platform_voucher_allocates_to_stores,
            voucher
        }

        return res.status(200).json({ code: 0, message: 'Áp dụng voucher của sàn thành công', data });

    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Áp dụng voucher của sàn thất bại', error: error.message });
    }
}

module.exports.applyShopVoucher = async (req, res) => {

    try {
        const { apply_type } = req.query;
        const { seller_id } = req.params;
        const { user_id, original_items_total, original_shipping_fee, voucher_code } = req.body;

        const errors = [];

        if (!apply_type || apply_type === '') errors.push('apply_type cần cung cấp');
        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!seller_id || seller_id <= 0) errors.push('seller_id cần cung cấp');
        if (!original_items_total || isNaN(original_items_total) || original_items_total < 0) errors.push('original_items_total phải là số và lơn hơn hoặc bằng 0');
        if (!original_shipping_fee || isNaN(original_shipping_fee) || original_shipping_fee < 0) errors.push('original_shipping_fee phải là số và lơn hơn hoặc bằng 0');
        if (!voucher_code || voucher_code === '') errors.push('voucher_code cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucher = await Voucher.findOne({
            where: {
                code: voucher_code,
                type: apply_type,
                issuer_type: 'shop',
                issuer_id: seller_id,
                start_date: {
                    [Op.lte]: new Date()
                },
                end_date: {
                    [Op.gte]: new Date()
                },
                is_active: true
            }
        })

        if (!voucher) {
            return res.status(400).json({ code: 1, message: 'Voucher không hợp lệ' });
        }

        const voucherUsages = await VoucherUsage.findAll({
            where: {
                user_id: user_id,
                is_applied: true
            },
            attributes: ['voucher_id']
        });

        const voucherIds = voucherUsages.map(voucherUsage => voucherUsage.voucher_id);

        if (voucherIds.includes(String(voucher.id))) {
            return res.status(400).json({ code: 1, message: 'Bạn đã sử dụng voucher này' });
        }

        if (voucher.min_order_value && original_items_total < voucher.min_order_value) {
            return res.status(400).json({ code: 1, message: 'Đơn hàng không đạt điều kiện sử dụng voucher', note: `Mua thêm ${voucher.min_order_value - original_items_total}đ để sử dụng voucher` });
        }

        let discount_amount_items = 0;
        let discount_amount_shipping = 0;

        let items_total_after_discount = original_items_total;
        let shipping_fee_after_discount = original_shipping_fee;

        if (voucher.type === 'order') {

            const discount_value = parseFloat(voucher.discount_value);

            if (voucher.discount_unit === 'amount') {
                discount_amount_items = discount_value;
            }
            else if (voucher.discount_unit === 'percent') {
                discount_amount_items = original_items_total * discount_value / 100;
            }

            if (voucher.max_discount_value && discount_amount_items > parseFloat(voucher.max_discount_value)) {
                discount_amount_items = parseFloat(voucher.max_discount_value);
            }

            if (discount_amount_items > original_items_total) {
                discount_amount_items = original_items_total;
            }

            items_total_after_discount = original_items_total - discount_amount_items;

            if (items_total_after_discount < 0) {
                items_total_after_discount = 0;
            }
        }
        else if (voucher.type === 'freeship') {

            const discount_value = parseFloat(voucher.discount_value);

            if (voucher.discount_unit === 'amount') {
                discount_amount_shipping = discount_value;
            }
            else if (voucher.discount_unit === 'percent') {
                discount_amount_shipping = original_shipping_fee * discount_value / 100;
            }

            if (voucher.max_discount_value && discount_amount_shipping > parseFloat(voucher.max_discount_value)) {
                discount_amount_shipping = parseFloat(voucher.max_discount_value);
            }

            if (discount_amount_shipping > original_shipping_fee) {
                discount_amount_shipping = original_shipping_fee;
            }

            shipping_fee_after_discount = original_shipping_fee - discount_amount_shipping;

            if (shipping_fee_after_discount < 0) {
                shipping_fee_after_discount = 0;
            }
        }

        const data = {
            voucher,
            original_items_total,
            original_shipping_fee,
            discount_amount_items,
            discount_amount_shipping,
            items_total_after_discount,
            shipping_fee_after_discount,
        }

        return res.status(200).json({ code: 0, message: 'Áp dụng voucher của cửa hàng thành công', data });

    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Áp dụng voucher của cửa hàng thất bại', error: error.message });
    }
}

module.exports.saveVoucherUsage = async (req, res) => {

    try {

        const { user_id, stores } = req.body;

        const errors = [];

        if (!user_id || user_id <= 0) errors.push('user_id cần cung cấp');
        if (!stores || !Array.isArray(stores)) errors.push('stores cần cung cấp');

        if (errors.length > 0) {
            return res.status(400).json({ code: 1, message: 'Xác thực thất bại', errors });
        }

        const voucherUsages = [];

        // Duyệt qua từng cửa hàng
        for (const store of stores) {
            const { 
                order_id,
                order_voucher: shop_order_voucher,
                freeship_voucher: shop_freeship_voucher,
                platform_order_voucher,
                platform_freeship_voucher,
            } = store;

            if(!order_id || order_id <= 0) {
                return res.status(400).json({ code: 1, message: 'order_id cần cung cấp để lưu lại voucher đã áp dụng' });
            }

            // Kiểm tra và thêm voucher order của shop nếu có
            if (shop_order_voucher && shop_order_voucher.is_applied && shop_order_voucher.voucher_id) {
                voucherUsages.push({
                    voucher_id: shop_order_voucher.voucher_id,
                    user_id: user_id,
                    order_id: order_id,
                    discount_amount: shop_order_voucher.discount_amount
                });
            }

            // Kiểm tra và thêm voucher freeship của shop nếu có
            if (shop_freeship_voucher && shop_freeship_voucher.is_applied && shop_freeship_voucher.voucher_id) {
                voucherUsages.push({
                    voucher_id: shop_freeship_voucher.voucher_id,
                    user_id: user_id,
                    order_id: order_id,
                    discount_amount: shop_freeship_voucher.discount_amount
                });
            }

            // Kiểm tra và thêm voucher order của sàn nếu có
            if (platform_order_voucher && platform_order_voucher.is_applied && platform_order_voucher.voucher_id) {
                voucherUsages.push({
                    voucher_id: platform_order_voucher.voucher_id,
                    user_id: user_id,
                    order_id: order_id,
                    discount_amount: platform_order_voucher.discount_amount
                });
            }

            // Kiểm tra và thêm voucher freeship của sàn nếu có
            if (platform_freeship_voucher && platform_freeship_voucher.is_applied && platform_freeship_voucher.voucher_id) {
                voucherUsages.push({
                    voucher_id: platform_freeship_voucher.voucher_id,
                    user_id: user_id,
                    order_id: order_id,
                    discount_amount: platform_freeship_voucher.discount_amount
                });
            }
        }

        // Lưu tất cả các voucher usage vào database
        const voucherUsagesSaved = await VoucherUsage.bulkCreate(voucherUsages);

        return res.status(201).json({ code: 0, message: 'Lưu lại voucher đã áp dụng thành công', data: voucherUsagesSaved  });

    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lưu lại voucher đã áp dụng thất bại', error: error.message });
    }
}

module.exports.getVoucherUsageByOrderId = async (req, res) => {
    try {
        const { order_id } = req.params;

        const query = `
            SELECT 
                vu.id,
                vu.voucher_id,
                vu.user_id,
                vu.order_id,
                vu.discount_amount,
                vu."createdAt" as usage_date,
                v.code,
                v.type,
                v.issuer_type,
                v.issuer_id,
                v.description,
                v.discount_unit,
                v.discount_value,
                v.max_discount_value,
                v.min_order_value
            FROM voucher_usages vu
            JOIN vouchers v ON vu.voucher_id = v.id
            WHERE vu.order_id = :order_id AND vu.is_applied = :is_applied
        `;

        const voucherUsages = await sequelize.query(query, {
            replacements: { order_id: order_id, is_applied: true },
            type: sequelize.QueryTypes.SELECT
        });

        // Format lại dữ liệu trả về
        const formattedVoucherUsages = voucherUsages.map(usage => ({
            id: usage.id,
            voucher_id: usage.voucher_id,
            user_id: usage.user_id,
            order_id: usage.order_id,
            discount_amount: usage.discount_amount,
            createdAt: usage.usage_date,
            voucher: {
                id: usage.voucher_id,
                code: usage.code,
                type: usage.type,
                issuer_type: usage.issuer_type,
                issuer_id: usage.issuer_id,
                description: usage.description,
                discount_unit: usage.discount_unit,
                discount_value: usage.discount_value,
                max_discount_value: usage.max_discount_value,
                min_order_value: usage.min_order_value
            }
        }));

        return res.status(200).json({ code: 0, message: 'Lấy voucher đã áp dụng của đơn hàng thành công', data: formattedVoucherUsages });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy voucher đã áp dụng của đơn hàng thất bại', error: error.message });
    }
}

module.exports.getVoucherUsageByUserId = async (req, res) => {
    try {
        const { user_id } = req.query;

        const query = `
            SELECT 
                vu.id,
                vu.voucher_id,
                vu.user_id,
                vu.order_id,
                vu.discount_amount,
                vu."createdAt" as usage_date,
                v.code,
                v.type,
                v.issuer_type,
                v.issuer_id,
                v.description,
                v.discount_unit,
                v.discount_value,
                v.max_discount_value,
                v.min_order_value
            FROM voucher_usages vu
            JOIN vouchers v ON vu.voucher_id = v.id
            WHERE vu.user_id = :user_id AND vu.is_applied = :is_applied
        `;

        const voucherUsages = await sequelize.query(query, {
            replacements: { user_id: user_id, is_applied: true },
            type: sequelize.QueryTypes.SELECT
        });

        const formattedVoucherUsages = voucherUsages.map(usage => ({
            id: usage.id,
            voucher_id: usage.voucher_id,
            user_id: usage.user_id,
            order_id: usage.order_id,
            discount_amount: usage.discount_amount,
            createdAt: usage.usage_date,
            voucher: {
                id: usage.voucher_id,
                code: usage.code,
                type: usage.type,
                issuer_type: usage.issuer_type,
                issuer_id: usage.issuer_id,
                description: usage.description,
                discount_unit: usage.discount_unit,
                discount_value: usage.discount_value,
                max_discount_value: usage.max_discount_value,
                min_order_value: usage.min_order_value
            }
        })); 

        return res.status(200).json({ code: 0, message: 'Lấy voucher đã áp dụng của user thành công', data: formattedVoucherUsages });
    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Lấy voucher đã áp dụng của user thất bại', error: error.message });
    }
}   

module.exports.restoreVoucherUsage = async (req, res) => {
    try {
        const { order_id } = req.params;

        const [affectedRows, updatedRows] = await VoucherUsage.update(
            { is_applied: false },
            { where: { order_id }, returning: true }
        );

        return res.status(200).json({ code: 0, message: 'Hoàn lại voucher đã áp dụng thành công', updatedRows });

    }
    catch (error) {
        return res.status(500).json({ code: 2, message: 'Hoàn lại voucher đã áp dụng thất bại', error: error.message });
    }
}

// Đây là dữ liệu mẫu tại client trước khi áp dụng voucher của shop
// const stores = [
//     {
//       seller_id: "1",
//       seller_name: "ABC Store",
//       total_quantity: 3,
//       total_price: 30000,
//       shipping_fee: 25000,
//       original_items_total: 30000,
//       original_shipping_fee: 25000,
//       discount_amount_items: 0,
//       discount_amount_shipping: 0,
//       items_total_after_discount: 30000,
//       shipping_fee_after_discount: 25000,
//       final_total: 55000,
//       order_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       platform_order_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       platform_freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       products: [
//         // danh sách sản phẩm
//       ]
//     },
//     {
//       seller_id: "2",
//       seller_name: "DEF Store",
//       total_quantity: 2,
//       total_price: 30000,
//       shipping_fee: 25000,
//       original_items_total: 30000,
//       original_shipping_fee: 25000,
//       discount_amount_items: 0,
//       discount_amount_shipping: 0,
//       items_total_after_discount: 30000,
//       shipping_fee_after_discount: 25000,
//       final_total: 55000, // 30000 + 25000
//       order_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       platform_order_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       platform_freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       products: [
//         // danh sách sản phẩm
//       ]
//     }
//   ];


// dữ liệu mẫu tại client sau khi áp dụng voucher của 1 shop ("ABC Store", code = "qfQUTDuBYl")
// const stores = [
//     {
//       seller_id: "1",
//       seller_name: "ABC Store",
//       total_quantity: 3,
//       total_price: 30000,
//       shipping_fee: 25000,
//       original_items_total: 30000,
//       original_shipping_fee: 25000,
//       discount_amount_items: 5000,
//       discount_amount_shipping: 0,
//       items_total_after_discount: 25000,
//       shipping_fee_after_discount: 25000,
//       final_total: 50000, // 25000 + 25000
//       order_voucher: {
//         is_applied: true,
//         code: "qfQUTDuBYl",
//         detail_voucher: {
//             id: "13",
//             code: "qfQUTDuBYl",
//             type: "order",
//             issuer_type: "shop",
//             issuer_id: "1",
//             description: "Giảm 5K cho đơn từ 25K",
//             discount_unit: "amount",
//             discount_value: "5000.00",
//             max_discount_value: null,
//             min_order_value: "25000.00",
//             start_date: "2025-05-24T00:00:00.000Z",
//             end_date: "2025-06-24T23:59:59.000Z",
//             is_active: true,
//             createdAt: "2025-05-24T08:25:48.375Z",
//             updatedAt: "2025-05-24T08:25:48.375Z"
//          },
//         discount_amount: 5000
//       },
//       freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       platform_order_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       platform_freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       products: [
//         // danh sách sản phẩm
//       ]
//     },
//     {
//       seller_id: "2",
//       seller_name: "DEF Store",
//       total_quantity: 2,
//       total_price: 30000,
//       shipping_fee: 15000,
//       original_items_total: 30000,
//       original_shipping_fee: 15000,
//       discount_amount_items: 0,
//       discount_amount_shipping: 0,
//       items_total_after_discount: 30000,
//       shipping_fee_after_discount: 15000,
//       final_total: 45000, // 30000 + 15000
//       order_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       platform_order_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       platform_freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null,
//         discount_amount: 0
//       },
//       products: [
//         // danh sách sản phẩm
//       ]
//     }
// ];

// const cartSummary = {
//     total_quantity: 5,            // Tổng số lượng sản phẩm trong giỏ của tất cả cửa hàng
//     stores_original_items_total: 60000,         // Tổng tiền hàng gốc của tất cả shop trước khi giảm giá
//     stores_original_shipping_fee: 40000,        // Tổng phí ship gốc của tất cả shop trước khi giảm giá
//     stores_discount_amount_items: 5000,        // Tổng giảm giá từ voucher order các shop (nếu có)
//     stores_discount_amount_shipping: 0,         // Tổng giảm giá từ voucher freeship các shop (nếu có)
//     stores_items_total_after_discount: 55000,   // Tổng tiền hàng sau giảm của tất cả shop
//     stores_shipping_fee_after_discount: 40000,  // Tổng phí ship sau giảm của tất cả shop (nếu có)
//     stores_final_total: 95000,                 // Tổng tiền đơn hàng cuối cùng của tất cả shop
//     platform_order_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null
//     },
//     platform_freeship_voucher: {
//         is_applied: false,
//         code: "",
//         detail_voucher: null
//     },
//     discount_amount_items_platform: 0,        // Tổng giảm giá từ voucher order của sàn
//     discount_amount_shipping_platform: 0,         // Tổng giảm giá từ voucher freeship của sàn
//     items_total_after_discount: 55000,   // Tổng tiền hàng sau khi dùng voucher của sàn (stores_items_total_after_discount - discount_amount_items_platform)
//     shipping_fee_after_discount: 40000,  // Tổng phí ship sau khi dùng voucher của sàn (stores_shipping_fee_after_discount - discount_amount_shipping_platform)
//     final_total_after_platform_voucher: 95000    // Tổng đơn hàng cuối cùng sau voucher sàn (items_total_after_discount + shipping_fee_after_discount)
// };

// Thông tin tại mỗi đơn hàng của shop trước khi thanh toán
// - Tổng tiền hàng gốc
// - Phí vận chuyển gốc
// - Giảm giá tiền hàng từ voucher shop
// - Giảm giá tiền vận chuyển từ voucher shop
// - Tổng tiền hàng sau voucher của shop
// - Phí vận chuyển sau voucher của shop
// - Giảm giả tiền hàng từ voucher sàn (trong trường hợp có nhiều shop thì mỗi shop chịu 1 phần)
// - Giảm giá tiền vận chuyển từ voucher sàn (trong trường hợp có nhiều shop thì mỗi shop chịu 1 phần)
// - Tổng tiền đơn hàng (tiền đơn hàng cuối cùng tại mỗi shop)