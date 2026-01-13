const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Database sementara (Vercel /tmp)
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'jestri-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Konfigurasi simpan gambar ke folder /tmp agar bisa diupload di Vercel
const upload = multer({ dest: '/tmp/' });
app.use('/uploads', express.static('/tmp'));

// --- ROUTES ---

// 1. Dashboard Pembeli
app.get('/', (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('index', { books });
});

// 2. Login Admin
app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login' });
});

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'jestri123') {
        req.session.isAdmin = true;
        return res.redirect('/admin-dashboard');
    }
    res.send('<script>alert("Password Salah!"); window.location="/login-admin";</script>');
});

// 3. Dashboard Admin
app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('admin', { mode: 'dashboard', books });
});

// 4. Proses Tambah Buku
app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    books.push({
        id: Date.now(),
        title: req.body.title,
        genre: req.body.genre,
        price: req.body.price,
        description: req.body.description,
        image: req.file ? req.file.filename : ''
    });
    fs.writeFileSync(booksPath, JSON.stringify(books));
    res.redirect('/admin-dashboard');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('Server Ready'));
module.exports = app;

