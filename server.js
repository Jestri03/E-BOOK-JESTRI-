const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware dasar
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session (Biar lo gak mental logout)
app.use(session({
    secret: 'jestri-ebook-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Karena Vercel pakai proxy
        maxAge: 3600000 
    }
}));

// ==========================================
// 1. MODE PEMBELI (TETAP SEPERTI DI VIDEO)
// ==========================================
app.get('/', (req, res) => {
    // Gue panggil index.ejs biar tampilan video lo gak berubah
    res.render('index'); 
});

// ==========================================
// 2. MODE ADMIN (FIX ERROR POST & GET)
// ==========================================

// Rute Login
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
        res.send("Login Gagal! <a href='/login'>Balik lagi</a>");
    }
});

// Dashboard Admin (Fix error: Cannot GET /jestri-control)
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Pastikan admin.ejs lo dapet variabel 'buku'
    res.render('admin', { buku: [] }); 
});

// Tambah Buku (KUNCI: Tetap di Dashboard Admin)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Logika simpan buku taruh sini
    res.redirect('/jestri-control'); // Tetap di dashboard, gak bakal logout
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
app.listen(PORT, () => console.log('Server Jestri Ready!'));

module.exports = app;

