const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware dasar
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session (Kunci biar admin gak logout sendiri)
app.use(session({
    secret: 'jestri-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Sesi 1 jam
}));

// ==========================================
// 1. MODE PEMBELI (SESUAI VIDEO LO - JANGAN DIUBAH)
// ==========================================
app.get('/', (req, res) => {
    // Menampilkan halaman utama pembeli lo
    res.render('index'); 
});

// Tambahkan rute kategori lain sesuai video lo di sini jika ada
// Contoh: app.get('/kategori', ...)

// ==========================================
// 2. MODE ADMIN (PERBAIKAN FITUR)
// ==========================================

// Rute Login
app.get('/login', (req, res) => {
    res.render('login');
});

// Proses Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Login Gagal! <a href='/login'>Kembali</a>");
    }
});

// Halaman Dashboard Admin (jestri-control)
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Berikan data buku kosong agar tidak error saat render table
    res.render('admin', { buku: [] }); 
});

// Proses Tambah Buku (KUNCI: Tetap di mode admin)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // --- Logika Simpan Database Lo Disini ---
    
    // Setelah berhasil, arahkan balik ke dashboard admin
    res.redirect('/jestri-control');
});

// Proses Hapus Buku
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // --- Logika Hapus Database Lo Disini ---
    
    res.redirect('/jestri-control');
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Menangani error rute tidak ditemukan
app.use((req, res) => {
    res.status(404).send("Halaman tidak ditemukan di server");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server nyala di port ${PORT}`));

module.exports = app;

