const { Op } = require('sequelize');
const ShippingAddress = require('../database/models/ShippingAddress');
const Joi = require('joi');

const shippingAddressSchema = Joi.object({
    address_name: Joi.string().required(),
    user_id: Joi.number().required(),
    full_name: Joi.string().required(),
    phone: Joi.string().required(),
    province_id: Joi.number().required(),
    province_name: Joi.string().required(),
    district_id: Joi.number().required(),
    district_name: Joi.string().required(),
    ward_code: Joi.string().required(),
    ward_name: Joi.string().required(),
    address_detail: Joi.string().required(),
    is_default: Joi.boolean().optional()
});

// Lấy danh sách shipping address của user
module.exports.getShippingAddresses = async (req, res) => {
    try {
        const { user_id } = req.query;
        const where = user_id ? { user_id } : {};
        const addresses = await ShippingAddress.findAll({ where });
        res.json({ code: 0, success: true, data: addresses });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Lấy shipping address theo ID
module.exports.getShippingAddressById = async (req, res) => {
    try {
        const address = await ShippingAddress.findByPk(req.params.id);
        if (!address) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping address not found' });
        }
        res.json({ code: 0, success: true, data: address });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Tạo shipping address mới
module.exports.createShippingAddress = async (req, res) => {
    const { error } = shippingAddressSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const address = await ShippingAddress.create(req.body);
        res.status(201).json({ code: 0, success: true, data: address });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Cập nhật shipping address
module.exports.updateShippingAddress = async (req, res) => {
    const { error } = shippingAddressSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: 1, success: false, message: error.details[0].message });
    }
    try {
        const address = await ShippingAddress.findByPk(req.params.id);
        if (!address) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping address not found' });
        }
        await address.update(req.body);
        res.json({ code: 0, success: true, data: address });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};

// Xóa shipping address
module.exports.deleteShippingAddress = async (req, res) => {
    try {
        const address = await ShippingAddress.findByPk(req.params.id);
        if (!address) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping address not found' });
        }
        await address.destroy();
        res.json({ code: 0, success: true, message: 'Shipping address deleted successfully' });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
}; 

module.exports.setDefaultShippingAddress = async (req, res) => {
    try {
        const address = await ShippingAddress.findByPk(req.params.id);
        if (!address) {
            return res.status(404).json({ code: 3, success: false, message: 'Shipping address not found' });
        }
        await ShippingAddress.update({ is_default: false }, { where: { user_id: address.user_id } });
        await address.update({ is_default: true });
        res.json({ code: 0, success: true, message: 'Shipping address set as default successfully', data: address });
    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
}