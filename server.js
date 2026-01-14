const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// --- CONFIGURATION ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session agar Admin tidak logout sendiri
app.use(session({
    secret: 'jestri-ebook-key-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set false karena pakai Vercel HTTP
        maxAge: 3600000 // Sesi aktif 1 jam
    }
}));

// ==========================================
// 1. MODE PEMBELI (TETAP SEPERTI DI VIDEO)
// ==========================================
app.get('/', (req, res) => {
    // Memanggil file index.ejs (tampilan menu genre lo)
    res.render('index'); 
});

// ==========================================
// 2. MODE ADMIN (FIX LOGIN & DASHBOARD)
// ==========================================

// Halaman Login Admin
app.get('/login', (req, res) => {
    res.render('login');
});

// Proses Login
app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    // Ganti username & password sesuai mau lo
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Login Gagal! <a href='/login'>Coba Lagi</a>");
    }
});

// Panel Kontrol Admin
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Kirim data 'buku' kosong [] agar tabel tidak error saat awal
    res.render('admin', { buku: [] }); 
});

// Tambah Buku (Kunci: Balik ke Dashboard, bukan Login)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Logika simpan buku lo di sini...
    
    res.redirect('/jestri-control'); 
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Server Listener
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Jestri jalan di port ${PORT}`);
});

module.exports = app;

