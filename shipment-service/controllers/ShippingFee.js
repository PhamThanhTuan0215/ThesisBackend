const ShippingAddress = require('../database/models/ShippingAddress');
const axiosStoreService = require('../services/storeService')
const axiosGHN = require('../services/apiGHN')

module.exports.calculateShippingFee = async (req, res) => {
    try {
        const { user_address, store_ids } = req.body;

        // từ dánh sách store_ids, gọi api lấy thông tin cửa hàng từ store service
        const response = await axiosStoreService.post('/stores/list', {
            store_ids
        });

        const storeInfos = response.data.data;

        // chuyển về kiểu storeOrderShippingFees[store_id]: {}
        const storeOrderShippingFees = storeInfos.reduce((acc, store) => {
            acc[store.id] = {
                seller_id: store.id,
                from_district_id: store.district_id,
                from_ward_code: store.ward_code,
                to_district_id: user_address.district_id,
                to_ward_code: user_address.ward_code,
                original_shipping_fee: 0
            };
            return acc;
        }, {});

        // Tạo mảng các promise để gọi API GHN cho từng store
        const shippingFeePromises = Object.entries(storeOrderShippingFees).map(([store_id, storeShipping]) => {
            return axiosGHN.post('/v2/shipping-order/fee', {
                service_type_id: 2,
                from_district_id: storeShipping.from_district_id,
                from_ward_code: storeShipping.from_ward_code,
                to_district_id: user_address.district_id,
                to_ward_code: user_address.ward_code,
                height: 10,
                length: 10,
                width: 10,
                weight: 200,
                insurance_value: 0,
                coupon: null
            }).then(response => {
                if (response.data.code === 200) {
                    // Lưu phí vận chuyển vào original_shipping_fee
                    storeOrderShippingFees[store_id].original_shipping_fee = response.data.data.total;
                } else {
                    console.error('GHN API Error:', response.data);
                }
                return response;
            });
        });

        // Thực hiện tất cả các API call đồng thời
        await Promise.all(shippingFeePromises);

        res.status(200).json({ code: 0, success: true, data: storeOrderShippingFees });

    } catch (error) {
        res.status(500).json({ code: 2, success: false, message: error.message });
    }
};
