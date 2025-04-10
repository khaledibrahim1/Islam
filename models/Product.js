const mongoose = require('mongoose');

// تعريف نموذج المنتج
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String, // لحفظ مسار الصورة
        required: false
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
