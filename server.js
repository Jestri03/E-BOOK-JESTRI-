const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Konfigurasi Dasar
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session (Biar Gak Logout Sendiri)
app.use(session({
    secret: 'jestri-ebook-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Sesi 1 jam
}));

// ==========================================
// 1. MODE PEMBELI (SESUAI VIDEO - JANGAN DIUBAH)
// ==========================================
app.get('/', (req, res) => {
    // Balikin ke tampilan menu genre lo
    res.render('index'); 
});

// ==========================================
// 2. MODE ADMIN (FIX ERROR POST & GET)
// ==========================================

// Halaman Login
app.get('/login', (req, res) => {
    res.render('login');
});

// Proses Login (Fix: "Cannot POST /admin-dashboard")
app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Login Gagal! <a href='/login'>Balik lagi</a>");
    }
});

// Dashboard Admin (Fix: "Cannot GET /jestri-control")
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // 'buku' dikirim [] biar gak error render tabelnya
    res.render('admin', { buku: [] }); 
});

// Tambah Buku (KUNCI: Tetap di Dashboard Admin)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Logika simpan buku lo taruh sini...
    
    // Balik ke dashboard, BUKAN ke login
    res.redirect('/jestri-control');
});

// Hapus Buku
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.redirect('/jestri-control');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Ready!'));

module.exports = app;

