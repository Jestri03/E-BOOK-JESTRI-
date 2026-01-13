const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression');
const helmet = require('helmet');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Path Database & Log
const booksPath = path.join('/tmp', 'books.json');
const securityLogPath = path.join('/tmp', 'security_audit.log');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));
if (!fs.existsSync(securityLogPath)) fs.writeFileSync(securityLogPath, '--- LOG KEAMANAN JESTRI ---\n');

// PERBAIKAN: Helmet disesuaikan agar tidak memblokir resource (Anti-Forbidden)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// PERBAIKAN: Trust Proxy untuk Vercel agar sesi tidak hilang
app.set('trust proxy', 1);

app.use(session({
    name: 'jestri_secure_core',
    secret: 'JESTRI-SUPER-SECRET-2026',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set false untuk lingkungan non-HTTPS/Vercel standard
        maxAge: 3600000 
    }
}));

const upload = multer({ dest: '/tmp/' });
app.use('/uploads', express.static('/tmp'));

// Middleware Admin
const secureAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) return next();
    res.redirect('/login-admin');
};

// Fungsi Watermark
async function prosesWatermark(inputPath, originalName) {
    const bytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(bytes);
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
        const data = fs.readFileSync(booksPath, 'utf8');
        res.render('index', { books: JSON.parse(data) });
    } catch (e) { res.render('index', { books: [] }); }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isAdmin = true;
        // Simpan sesi secara manual sebelum redirect untuk mencegah Forbidden
        req.session.save((err) => {
            if (err) return res.status(500).send("Gagal simpan sesi");
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

// PERBAIKAN: Menambahkan route yang hilang agar tidak "Cannot GET"
app.get('/cek-keamanan-jestri', secureAdmin, (req, res) => {
    if (fs.existsSync(securityLogPath)) {
        const logs = fs.readFileSync(securityLogPath, 'utf8');
        res.send(`<pre>${logs}</pre>`);
    } else {
        res.send("Belum ada data.");
    }
});

// PERBAIKAN: Route Watermark Lab tanpa pengecekan middleware yang terlalu ketat (Anti-Forbidden)
app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("Forbidden: Sesi berakhir");
    if (!req.file) return res.send("File tidak ditemukan!");
    try {
        const securedPath = await prosesWatermark(req.file.path, req.file.originalname);
        res.download(securedPath);
    } catch (err) { res.status(500).send("Error PDF"); }
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
    } catch (err) { res.status(500).send("Error simpan buku"); }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('🛡️ Website Secured & Fixed'));
module.exports = app;

