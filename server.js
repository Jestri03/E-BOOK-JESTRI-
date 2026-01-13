const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Data Buku Permanen (Agar tidak Internal Server Error)
const PERMANENT_BOOKS = [
    {
        id: 1,
        title: "The Psychology of Money",
        genre: "Fiksi/Finansial",
        price: "2.800",
        description: "Penulis: Morgan Housel",
        image: "https://i.ibb.co/LzNfXf0/1000715150.jpg" // Menggunakan gambar yang kamu kirim
    }
];

const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify(PERMANENT_BOOKS));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'jestri-secure-2026',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const upload = multer({ dest: '/tmp/' });

// --- ROUTES (Tampilan Tetap Sama) ---

app.get('/', (req, res) => {
    try {
        let books = PERMANENT_BOOKS;
        if (fs.existsSync(booksPath)) {
            const uploaded = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
            // Gabungkan buku permanen dengan buku yang baru diupload admin
            books = [...PERMANENT_BOOKS, ...uploaded.filter(b => b.id !== 1)];
        }
        res.render('index', { books });
    } catch (e) { res.render('index', { books: PERMANENT_BOOKS }); }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isAdmin = true;
        req.session.save(() => res.redirect('/admin-dashboard'));
    } else {
        res.send('<script>alert("Salah!"); window.location="/login-admin";</script>');
    }
});

app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const data = fs.existsSync(booksPath) ? JSON.parse(fs.readFileSync(booksPath, 'utf8')) : PERMANENT_BOOKS;
    res.render('admin', { mode: 'dashboard', books: data });
});

// Fitur Watermark (Tanpa Error Forbidden)
app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send("Sesi Berakhir");
    if (!req.file) return res.send("File tidak ada");
    try {
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        pdfDoc.getPages().forEach(p => p.drawText('E-BOOK JESTRI', { x: 50, y: 50, size: 50, opacity: 0.3 }));
        const pdfBytes = await pdfDoc.save();
        const out = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(out, pdfBytes);
        res.download(out);
    } catch (err) { res.send("Error PDF"); }
});

app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = fs.existsSync(booksPath) ? JSON.parse(fs.readFileSync(booksPath, 'utf8')) : [];
    books.push({
        id: Date.now(), title: req.body.title, genre: req.body.genre,
        price: req.body.price, description: req.body.description,
        image: req.file ? req.file.filename : ''
    });
    fs.writeFileSync(booksPath, JSON.stringify(books));
    res.redirect('/admin-dashboard');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('Ready'));
module.exports = app;

