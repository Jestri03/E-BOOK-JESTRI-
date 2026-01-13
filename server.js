const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// PENTING: Pengaturan Sesi Login
app.use(session({
    secret: 'jestri-keamanan-tinggi',
    resave: false,
    saveUninitialized: false, // Diubah ke false agar lebih aman
    cookie: { maxAge: 3600000 } // Sesi aktif selama 1 jam
}));

const upload = multer({ dest: '/tmp/' });

// 1. Halaman Utama (TIDAK BERUBAH)
app.get('/', (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('index', { books });
});

// 2. Proses Login
app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login', books: [] }); 
});

app.post('/login-admin', (req, res) => {
    // Password kamu: jestri123
    if (req.body.password === 'jestri123') {
        req.session.isAdmin = true; // Tandai sudah login
        return res.redirect('/admin-dashboard');
    }
    res.send('Password salah! <a href="/login-admin">Coba lagi</a>');
});

// 3. Proteksi Dashboard (Kunci agar tidak langsung terbuka)
app.get('/admin-dashboard', (req, res) => {
    if (req.session.isAdmin === true) {
        const books = JSON.parse(fs.readFileSync(booksPath));
        return res.render('admin', { mode: 'dashboard', books }); 
    } else {
        // Jika belum login, paksa ke halaman login
        return res.redirect('/login-admin');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login-admin');
});

app.listen(PORT, () => console.log('Sistem Keamanan Aktif'));
module.exports = app;

