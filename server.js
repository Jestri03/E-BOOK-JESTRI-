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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Konfigurasi Sesi
app.use(session({
    secret: 'jestri-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Konfigurasi Upload Gambar
const upload = multer({ dest: '/tmp/' });

// 1. DASHBOARD PEMBELI (Halaman Utama)
app.get('/', (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('index', { books });
});

// 2. LOGIN ADMIN
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

// 3. DASHBOARD ADMIN
app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('admin', { mode: 'dashboard', books });
});

// 4. PROSES TAMBAH BUKU (FIX ERROR CANNOT POST)
app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send('Akses Ditolak');
    
    const books = JSON.parse(fs.readFileSync(booksPath));
    const newBook = {
        id: Date.now(),
        title: req.body.title,
        genre: req.body.genre, // Menyimpan genre yang kamu pilih
        price: req.body.price,
        description: req.body.description,
        image: req.file ? req.file.filename : '' // Menyimpan nama file gambar
    };
    
    books.push(newBook);
    fs.writeFileSync(booksPath, JSON.stringify(books));
    
    // Setelah berhasil simpan, kembali ke dashboard admin
    res.redirect('/admin-dashboard');
});

// 5. LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('Server Aktif'));
module.exports = app;

