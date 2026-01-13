const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// PERBAIKAN: Penanganan database agar tidak Internal Server Error
const booksPath = path.join('/tmp', 'books.json');
const logPath = path.join('/tmp', 'security_audit.log');

const ensureFilesExist = () => {
    try {
        if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));
        if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, '--- LOG ---');
    } catch (e) { console.error("File Init Error"); }
};
ensureFilesExist();

app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// PERBAIKAN: Sesi distabilkan agar tidak "Forbidden" saat upload PDF
app.use(session({
    secret: 'jestri-secret-core',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 }
}));

const upload = multer({ dest: '/tmp/' });
app.use('/uploads', express.static('/tmp'));

// --- ROUTES (Tampilan Tetap Sama) ---

app.get('/', (req, res) => {
    ensureFilesExist();
    try {
        const data = fs.readFileSync(booksPath, 'utf8');
        res.render('index', { books: JSON.parse(data || "[]") });
    } catch (e) { res.render('index', { books: [] }); }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isAdmin = true;
        // PERBAIKAN: Paksa simpan sesi sebelum pindah halaman
        req.session.save(() => res.redirect('/admin-dashboard'));
    } else {
        res.send('<script>alert("Salah!"); window.location="/login-admin";</script>');
    }
});

app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    ensureFilesExist();
    try {
        const data = fs.readFileSync(booksPath, 'utf8');
        res.render('admin', { mode: 'dashboard', books: JSON.parse(data || "[]") });
    } catch (e) { res.render('admin', { mode: 'dashboard', books: [] }); }
});

// PERBAIKAN: Route Watermark (Fokus Anti-Forbidden)
app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("Forbidden: Login Ulang");
    if (!req.file) return res.send("File PDF kosong!");
    try {
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        const pages = pdfDoc.getPages();
        pages.forEach(p => p.drawText('E-BOOK JESTRI', { x: 50, y: 50, size: 50, opacity: 0.3 }));
        
        const pdfBytes = await pdfDoc.save();
        const out = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(out, pdfBytes);
        res.download(out);
    } catch (err) { res.status(500).send("Gagal proses PDF"); }
});

app.get('/cek-keamanan-jestri', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    ensureFilesExist();
    res.send(`<pre>${fs.readFileSync(logPath, 'utf8')}</pre>`);
});

app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    ensureFilesExist();
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8') || "[]");
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

app.listen(PORT, () => console.log('Fixed'));
module.exports = app;

