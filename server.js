const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Database & Log Security Path
const booksPath = path.join('/tmp', 'books.json');
const securityLogPath = path.join('/tmp', 'security_audit.log');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));
if (!fs.existsSync(securityLogPath)) fs.writeFileSync(securityLogPath, '--- LOG KEAMANAN JESTRI ---\n');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Limit ditingkatkan untuk PDF

// Sesi Keamanan
app.use(session({
    name: 'jestri_secure_core',
    secret: 'X-CORE-JESTRI-SUPER-ENCRYPT-999',
    resave: true,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 3600000 }
}));

// Konfigurasi Multer untuk PDF dan Gambar
const upload = multer({ 
    dest: '/tmp/', 
    limits: { fileSize: 50 * 1024 * 1024 } // Mendukung file hingga 50MB
});

app.use('/uploads', express.static('/tmp'));

// Middleware Kunci Admin (Diperbaiki agar tidak 'Forbidden')
const secureAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        return next();
    }
    res.status(403).send('Akses Ditolak: Silakan Login Kembali.');
};

// --- FUNGSI WATERMARK ---
async function prosesWatermark(inputPath, originalName) {
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText('E-BOOK JESTRI', {
            x: width / 5,
            y: height / 2.5,
            size: 60,
            color: rgb(0.8, 0.8, 0.8),
            opacity: 0.3,
            rotate: degrees(45),
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
        return res.redirect('/admin-dashboard');
    }
    res.status(401).send('<script>alert("PASSWORD SALAH!"); window.location="/login-admin";</script>');
});

app.get('/admin-dashboard', secureAdmin, (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    res.render('admin', { mode: 'dashboard', books });
});

// Perbaikan Route Secure PDF
app.post('/secure-pdf', secureAdmin, upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("File PDF belum dipilih!");
    try {
        const securedPath = await prosesWatermark(req.file.path, req.file.originalname);
        res.download(securedPath, (err) => {
            if (err) console.log("Download error:", err);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Hapus file temporary
        });
    } catch (err) { 
        console.error(err);
        res.send("Gagal memproses PDF. Pastikan file tidak diproteksi password."); 
    }
});

app.post('/add-book', secureAdmin, upload.single('image'), (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        books.push({
            id: Date.now(),
            title: req.body.title,
            genre: req.body.genre,
            price: req.body.price,
            description: req.body.description || 'Admin',
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

app.listen(PORT, () => console.log('🛡️ Website Secured & PDF Fixed'));
module.exports = app;

