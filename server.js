const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session (Kunci Utama Fix Logout)
app.use(session({
    secret: 'jestri-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Karena Vercel menggunakan HTTPS proxy
        maxAge: 3600000 // 1 Jam
    }
}));

// ==========================================
// 1. MODE PEMBELI (TAMPILAN UTAMA / INDEX)
// ==========================================
app.get('/', (req, res) => {
    // Menampilkan halaman sesuai video (Menu Genre)
    res.render('index', { buku: [] }); 
});

// ==========================================
// 2. MODE ADMIN (PERBAIKAN LOGIKA)
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
    // Pastikan data 'buku' dikirim agar admin.ejs tidak crash
    res.render('admin', { buku: [] }); 
});

// Tambah Buku (Fix: Tetap di Dashboard)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Logika simpan DB Anda di sini...
    res.redirect('/jestri-control'); // Balik ke dashboard, bukan login
});

// Hapus Buku
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Logika hapus DB Anda di sini...
    res.redirect('/jestri-control');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server nyala di port ${PORT}`));

module.exports = app;

