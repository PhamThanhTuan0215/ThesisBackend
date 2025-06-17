const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const CatalogProduct = require('./CatalogProduct')

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    catalog_product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'catalog_products',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    import_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    }, // giá nhập hàng
    import_date: {
        type: DataTypes.DATE,
        allowNull: false,
    }, // ngày nhập hàng
    url_import_invoice: {
        type: DataTypes.STRING,
        allowNull: false,
    }, // giấy hóa đơn nhập hàng
    retail_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    }, // giá bán lẻ
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    seller_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    seller_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    approval_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
        validate: {
            isIn: {
                args: [["pending", "approved", "rejected"]],
                msg: "approval_status must be pending, approved, or rejected"
            }
        }
    },
    active_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
        validate: {
            isIn: {
                args: [["active", "inactive"]],
                msg: "active_status must be active or inactive"
            }
        }
    }, // trạng thái hoạt động do nhà bán quản lý (1 sản phẩm chỉ được bán cho khách hàng khi active_status của sàn và active_status của nhà bán cùng là active)
    return_policy: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
            isJSON(value) {
                if (typeof value !== 'object' || Array.isArray(value)) {
                    throw new Error('return_policy must be a valid JSON object');
                }
            }
        }
    },
    promotion_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "none"
    }, // kiểu khuyến mãi (none: không có khuyến mãi, flash_sale: khuyến mãi flash sale, ...)
    promotion_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    }, //tỉ lệ giá trị khuyến mãi (0% nếu không có khuyến mãi)
    promotion_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
    }, // ngày bắt đầu khuyến mãi (mặc định lưu giống chương trình khuyến mãi được áp dụng, sau đó có thể tùy chỉnh cho từng sản phẩm)
    promotion_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
    }, // ngày kết thúc khuyến mãi (mặc định lưu giống chương trình khuyến mãi được áp dụng, sau đó có thể tùy chỉnh cho từng sản phẩm)
    actual_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    } // giá bán thực tế sẽ hiển thị cho khách hàng (sau khi áp dụng khuyến mãi)
}, {
    tableName: 'products' // TABLE_NAME
});

// thiết lập mặc định cho giá bán thực tế
Product.beforeSave(async (product, options) => {
    product.actual_price = product.retail_price;
});

// // tính toán giá thực tế sau khi áp dụng khuyến mãi trước khi trả về kết quả (để có thể linh hoạt thay đổi giá trị hiển thị mà không cần phải chỉnh sửa)
Product.addHook('afterFind', (result, options) => {
    const now = new Date();

    const applyActualPrice = (p) => {
        if (!p) return;

        const isPromotionActive =
            p.promotion_type !== "none" &&
            (!p.promotion_start_date || p.promotion_start_date <= now) &&
            (!p.promotion_end_date || p.promotion_end_date >= now);

        p.actual_price = isPromotionActive
            ? Number(p.retail_price) * (1 - Number(p.promotion_value) / 100)
            : Number(p.retail_price);
    };

    if (Array.isArray(result)) {
        result.forEach(applyActualPrice);
    } else {
        applyActualPrice(result);
    }
});

Product.belongsTo(CatalogProduct, { foreignKey: 'catalog_product_id' });

module.exports = Product;