const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// PERBAIKAN: Memastikan folder /tmp siap digunakan sebelum aplikasi jalan
const booksPath = path.join('/tmp', 'books.json');
const securityLogPath = path.join('/tmp', 'security_audit.log');

function initializeData() {
    try {
        if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));
        if (!fs.existsSync(securityLogPath)) fs.writeFileSync(securityLogPath, '--- LOG KEAMANAN JESTRI ---\n');
    } catch (err) {
        console.error("Gagal inisialisasi file:", err);
    }
}
initializeData();

app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// PERBAIKAN: Sesi dibuat lebih simpel agar tidak memicu "Forbidden" di Vercel
app.use(session({
    secret: 'jestri-core-secret-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 }
}));

const upload = multer({ dest: '/tmp/' });
app.use('/uploads', express.static('/tmp'));

// Fungsi Watermark
async function prosesWatermark(inputPath, originalName) {
    const bytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText('E-BOOK JESTRI', {
            x: width / 5, y: height / 2.5, size: 55,
            color: rgb(0.8, 0.8, 0.8), opacity: 0.3, rotate: degrees(45),
        });
    });
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join('/tmp', 'SECURED_' + originalName);
    fs.writeFileSync(outputPath, pdfBytes);
    return outputPath;
}

// --- ROUTES (Tampilan Tidak Berubah) ---

app.get('/', (req, res) => {
    try {
        // PERBAIKAN: Tambahan pengecekan agar tidak "Internal Server Error" jika file kosong
        if (!fs.existsSync(booksPath)) initializeData();
        const data = fs.readFileSync(booksPath, 'utf8');
        res.render('index', { books: JSON.parse(data || "[]") });
    } catch (e) { 
        res.render('index', { books: [] }); 
    }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isAdmin = true;
        // Simpan sesi sebelum redirect untuk cegah Forbidden
        req.session.save(() => res.redirect('/admin-dashboard'));
    } else {
        res.send('<script>alert("Password Salah!"); window.location="/login-admin";</script>');
    }
});

app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    try {
        if (!fs.existsSync(booksPath)) initializeData();
        const data = fs.readFileSync(booksPath, 'utf8');
        res.render('admin', { mode: 'dashboard', books: JSON.parse(data || "[]") });
    } catch (e) {
        res.render('admin', { mode: 'dashboard', books: [] });
    }
});

app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("Sesi berakhir, login ulang.");
    if (!req.file) return res.send("File PDF belum dipilih!");
    try {
        const securedPath = await prosesWatermark(req.file.path, req.file.originalname);
        res.download(securedPath);
    } catch (err) { res.send("Gagal memproses PDF."); }
});

app.get('/cek-keamanan-jestri', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    try {
        const logs = fs.readFileSync(securityLogPath, 'utf8');
        res.send(`<pre>${logs}</pre>`);
    } catch (e) { res.send("Log belum tersedia."); }
});

app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    try {
        const data = fs.readFileSync(booksPath, 'utf8');
        const books = JSON.parse(data || "[]");
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

