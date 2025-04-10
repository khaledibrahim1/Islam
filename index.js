require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const productRoutes = require('./routes/productRoutes');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;  // استخدم المنفذ من ملف .env أو 3000 كافتراضي

// إعداد multer لتخزين الملفات
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'uploads/')); // ✅
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`); // حفظ الصورة مع توقيت فريد
    }
});
const upload = multer({ storage: storage });

// إعداد الجلسة
app.use(session({
    secret: process.env.SESSION_SECRET,  // استخدم السر من ملف .env
    resave: false,
    saveUninitialized: true
}));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // السماح للوصول إلى مجلد public

// الاتصال بقاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO_URI, {  // استخدم رابط الاتصال من ملف .env
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log("🚀 MongoDB connected");
    })
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
    });

// حماية مسارات الأدمن
app.use('/api/products', (req, res, next) => {
    if (!req.session.loggedIn) {
        return res.status(401).json({ message: "غير مصرح" });
    }
    next();
});

app.use('/api/products', productRoutes);

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        req.session.loggedIn = true;
        return res.json({ message: 'تم تسجيل الدخول' });
    }
    return res.status(401).json({ message: 'بيانات خاطئة' });
});

// إضافة منتج جديد مع صورة
app.post('/api/products', upload.single('image'), async (req, res) => {
    const { name, description, price } = req.body;
    const image = req.file ? `uploads//${req.file.filename}` : null;

    try {
        const newProduct = new Product({
            name,
            description,
            price,
            image
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        console.error('Error while adding product:', err);
        res.status(500).json({ message: 'حدث خطأ أثناء إضافة المنتج' });
    }
});

// تعديل منتج بناءً على ID
app.put('/api/products/update/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;
    const image = req.file ? `uploads//${req.file.filename}` : null;

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
        console.error('Error while updating product:', err);
        res.status(500).json({ message: 'حدث خطأ أثناء التعديل' });
    }
});

// عرض تفاصيل المنتج بناءً على ID
app.get('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'المنتج غير موجود' });
        }
        res.json(product);
    } catch (err) {
        console.error('Error while fetching product details:', err);
        res.status(500).json({ message: 'حدث خطأ في جلب البيانات' });
    }
});

// عرض صفحة إضافة منتج جديد
app.get('/product/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// تسجيل الخروج
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الخروج' });
        }
        res.json({ message: 'تم تسجيل الخروج' });
    });
});

app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'حدث خطأ في جلب المنتجات' });
    }
});

// بدء الخادم
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
