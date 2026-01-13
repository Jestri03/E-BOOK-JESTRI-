const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Minimalis untuk Vercel
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) {
    fs.writeFileSync(booksPath, JSON.stringify([]));
}

app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
    secret: 'JESTRI-SUPER-SECURE-KEY-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 3600000 }
}));

const upload = multer({ dest: '/tmp/' });

// Fungsi Watermark Aman untuk Serverless
async function prosesWatermark(buffer, originalName) {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText('E-BOOK JESTRI', {
            x: width / 5,
            y: height / 2.5,
            size: 50,
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.4,
            rotate: degrees(45),
        });
    });
    return await pdfDoc.save();
}

// --- ROUTES UTAMA ---

app.get('/', (req, res) => {
    try {
        const data = fs.readFileSync(booksPath, 'utf8');
        const books = JSON.parse(data);
        res.render('index', { books });
    } catch (e) {
        res.render('index', { books: [] });
    }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isAdmin = true;
        req.session.userAgent = req.headers['user-agent'];
        return res.redirect('/admin-dashboard');
    }
    res.send('<script>alert("PASSWORD SALAH!"); window.location="/login-admin";</script>');
});

app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        res.render('admin', { mode: 'dashboard', books });
    } catch (e) {
        res.render('admin', { mode: 'dashboard', books: [] });
    }
});

app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.session.isAdmin || !req.file) return res.status(403).send("Akses Ditolak");
    try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const pdfBytes = await prosesWatermark(fileBuffer, req.file.originalname);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=SECURED_${req.file.originalname}`);
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        res.status(500).send("Gagal memproses PDF.");
    }
});

app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("Akses Ditolak");
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

module.exports = app;

