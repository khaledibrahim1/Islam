const express = require('express');
const multer = require('multer');
const router = express.Router();
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// تحديد المسار الصحيح للمجلد
const uploadPath = path.join(__dirname, '..', 'public', 'uploads');

// التأكد من وجود المجلد عند بدء التطبيق فقط
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath); // المسار الصحيح
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// عرض جميع المنتجات
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'حدث خطأ أثناء جلب المنتجات' });
    }
});

// إضافة منتج جديد
router.post('/add', upload.single('image'), async (req, res) => {
    const { name, description, price } = req.body;
    const image = req.file ? path.join('uploads', req.file.filename) : null;

    if (!name || !description || !price) {
        return res.status(400).json({ message: 'يجب أن تحتوي جميع الحقول على بيانات' });
    }

    try {
        const product = new Product({ name, description, price, image });
        await product.save();
        res.json({ message: 'تمت الإضافة بنجاح' });
    } catch (err) {
        res.status(500).json({ message: 'حدث خطأ أثناء إضافة المنتج' });
    }
});

// حذف منتج
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'المنتج غير موجود' });
        }

        res.json({ message: 'تم الحذف بنجاح' });
    } catch (err) {
        res.status(500).json({ message: 'حدث خطأ أثناء الحذف' });
    }
});

// تعديل منتج
router.put('/update/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;
    const image = req.file ? path.join('uploads', req.file.filename) : null; // تحديث مع المسار الصحيح

    if (!name || !description || !price) {
        return res.status(400).json({ message: 'يجب أن تحتوي جميع الحقول على بيانات' });
    }

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { name, description, price, image },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'المنتج غير موجود' });
        }

        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ message: 'حدث خطأ أثناء التعديل' });
    }
});

module.exports = router;
