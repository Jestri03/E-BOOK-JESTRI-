const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Gunakan folder /tmp agar Vercel bisa menulis data sementara
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) {
    fs.writeFileSync(booksPath, JSON.stringify([]));
}

// PENGATURAN PATH (Kunci agar Admin tidak Error)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'jestri-secret',
    resave: false,
    saveUninitialized: true
}));

const upload = multer({ dest: '/tmp/' });

// --- ROUTES ---

// Halaman Utama Pembeli (Sudah Berhasil)
app.get('/', (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath));
        res.render('index', { books });
    } catch (err) {
        res.render('index', { books: [] });
    }
});

// Halaman Login Admin
app.get('/login-admin', (req, res) => {
    res.render('admin-login'); 
});

app.post('/login-admin', (req, res) => {
    const { password } = req.body;
    if (password === 'jestri123') {
        req.session.isAdmin = true;
        res.redirect('/admin-dashboard');
    } else {
        res.send('Password Salah! <a href="/login-admin">Kembali</a>');
    }
});

// Halaman Dashboard Admin
app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    try {
        const books = JSON.parse(fs.readFileSync(booksPath));
        res.render('admin-dashboard', { books });
    } catch (err) {
        res.render('admin-dashboard', { books: [] });
    }
});

// Proses Tambah Buku
app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const { title, price, description } = req.body;
    let books = [];
    try {
        books = JSON.parse(fs.readFileSync(booksPath));
    } catch (e) { books = []; }

    books.push({
        id: Date.now(),
        title, price, description,
        image: req.file ? req.file.filename : ''
    });

    fs.writeFileSync(booksPath, JSON.stringify(books));
    res.redirect('/admin-dashboard');
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server nyala di port ${PORT}`);
});

module.exports = app;

