const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Path
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

// PENTING UNTUK VERCEL: Trust Proxy
app.set('trust proxy', 1);

app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());

// SESI STABIL (Anti-Forbidden)
app.use(session({
    secret: 'jestri-core-secret-2026',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set false agar bisa jalan di semua browser
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

const upload = multer({ dest: '/tmp/' });
app.use('/uploads', express.static('/tmp'));

// Proteksi Admin Sederhana tapi Kuat
const secureAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/login-admin');
};

// --- FUNGSI WATERMARK ---
async function prosesWatermark(inputPath, originalName) {
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText('E-BOOK JESTRI', {
            x: width / 5, y: height / 2.5, size: 60,
            color: rgb(0.8, 0.8, 0.8), opacity: 0.3, rotate: degrees(45),
        });
    });
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join('/tmp', 'SECURED_' + originalName);
    fs.writeFileSync(outputPath, pdfBytes);
    return outputPath;
}

// --- ROUTES ---

app.get('/', (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        res.render('index', { books });
    } catch (e) { res.render('index', { books: [] }); }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isAdmin = true;
        req.session.save(() => {
            res.redirect('/admin-dashboard');
        });
    } else {
        res.send('<script>alert("Password Salah!"); window.location="/login-admin";</script>');
    }
});

app.get('/admin-dashboard', secureAdmin, (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    res.render('admin', { mode: 'dashboard', books });
});

app.post('/secure-pdf', secureAdmin, upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("File belum dipilih");
    try {
        const securedPath = await prosesWatermark(req.file.path, req.file.originalname);
        res.download(securedPath);
    } catch (err) { res.send("Gagal proses PDF"); }
});

app.post('/add-book', secureAdmin, upload.single('image'), (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        books.push({
            id: Date.now(), title: req.body.title, genre: req.body.genre,
            price: req.body.price, description: req.body.description || 'Admin',
            image: req.file ? req.file.filename : ''
        });
        fs.writeFileSync(booksPath, JSON.stringify(books));
        res.redirect('/admin-dashboard');
    } catch (err) { res.redirect('/admin-dashboard'); }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('Server Ready'));
module.exports = app;

