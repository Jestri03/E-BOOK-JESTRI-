const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware Dasar
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session agar Admin tidak mental ke Login
app.use(session({
    secret: 'jestri-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set false karena Vercel pakai proxy
        maxAge: 3600000 
    }
}));

// ==========================================
// 1. MODE PEMBELI (TIDAK DIUBAH - SESUAI VIDEO)
// ==========================================
app.get('/', (req, res) => {
    // Menampilkan halaman utama (Menu Genre, Fiksi, Teknologi, dll)
    res.render('index'); 
});

// ==========================================
// 2. MODE ADMIN (FIX ERROR CANNOT GET/POST)
// ==========================================

// Halaman Login
app.get('/login', (req, res) => {
    res.render('login');
});

// Proses Login (Fix error: Cannot POST /admin-dashboard)
app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Login Gagal! <a href='/login'>Kembali</a>");
    }
});

// Dashboard Admin (Fix error: Cannot GET /jestri-control)
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // 'buku' harus dikirim (meski kosong) agar admin.ejs tidak crash
    res.render('admin', { buku: [] }); 
});

// Tambah Buku (KUNCI: Tetap di Dashboard Admin)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Logika database Anda di sini (misal simpan ke MongoDB/MySQL)
    
    // Redirect kembali ke dashboard admin, BUKAN ke login
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

// Server Listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server nyala di port ${PORT}`));

module.exports = app;

