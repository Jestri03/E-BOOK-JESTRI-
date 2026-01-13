const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware dasar (WAJIB ADA)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session (Biar Admin Gak Logout Sendiri)
app.use(session({
    secret: 'kunci-rahasia-jestri',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Aktif 1 jam
}));

// ==========================================
// 1. MODE PEMBELI (TIDAK DIUBAH)
// ==========================================
app.get('/', (req, res) => {
    // Menampilkan halaman utama pembeli (menu genre dll)
    // Pastikan file lo namanya 'index.ejs'
    res.render('index'); 
});

// ==========================================
// 2. MODE ADMIN (FIX REDIRECT & SESSION)
// ==========================================

// Halaman Login
app.get('/login', (req, res) => {
    res.render('login');
});

// Proses Login (Fix: Cannot POST /admin-dashboard)
app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Login Gagal! <a href='/login'>Coba Lagi</a>");
    }
});

// Panel Admin (Fix: Cannot GET /jestri-control)
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Kirim data buku kosong [] biar gak error render table
    res.render('admin', { buku: [] }); 
});

// Tambah Buku (KUNCI: Tetap di Dashboard Admin)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Simpan data buku lo di sini (Logika DB)
    
    // SETELAH BERHASIL: Balik ke dashboard admin, bukan login!
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
app.listen(PORT, () => console.log(`Server nyala!`));

module.exports = app;

