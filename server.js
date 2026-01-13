const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Database sementara untuk Vercel
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

// Konfigurasi View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Sesi Login Admin
app.use(session({
    secret: 'jestri-secret-key',
    resave: false,
    saveUninitialized: true
}));

const upload = multer({ dest: '/tmp/' });

// --- ROUTES ---

// 1. Halaman Utama (TIDAK DIUBAH)
app.get('/', (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('index', { books });
});

// 2. Halaman Login Admin (Menggunakan admin.ejs)
app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login', books: [] }); 
});

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'jestri123') {
        req.session.isAdmin = true;
        return res.redirect('/admin-dashboard');
    }
    res.send('Password salah! <a href="/login-admin">Kembali</a>');
});

// 3. Halaman Dashboard Admin (Menggunakan admin.ejs)
app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('admin', { mode: 'dashboard', books }); 
});

// 4. Fitur Tambah Buku
app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    books.push({
        id: Date.now(),
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        image: req.file ? req.file.filename : ''
    });
    fs.writeFileSync(booksPath, JSON.stringify(books));
    res.redirect('/admin-dashboard');
});

// 5. Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('Server Mode Admin Aktif'));
module.exports = app;

