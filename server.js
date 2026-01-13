const express = require('express');
const session = require('express-session');
const app = express();

// Middleware agar bisa membaca input dari form
app.use(express.urlencoded({ extended: true }));

// Pengaturan Session
app.use(session({
    secret: 'rahasia',
    resave: false,
    saveUninitialized: true
}));

// --- ROUTE LOGIN (Menampilkan Halaman) ---
app.get('/login', (req, res) => {
    res.render('login'); // Pastikan ada file login.ejs di folder views
});

// --- ROUTE LOGIN (Proses data dari Form) ---
// Ini yang menyebabkan "Cannot POST /admin-dashboard" jika salah
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Cek login sederhana
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin-dashboard'); // Setelah sukses, pindah ke dashboard
    } else {
        res.send('Login Gagal');
    }
});

// --- ROUTE DASHBOARD ---
app.get('/admin-dashboard', (req, res) => {
    if (req.session.isAdmin) {
        res.render('admin'); // Tampilkan halaman admin.ejs
    } else {
        res.redirect('/login');
    }
});

// ROUTE TAMBAH BUKU (Supaya tidak logout setelah tambah)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');
    
    // ... kode simpan ke database ...
    
    // KUNCI: Redirect kembali ke dashboard admin, BUKAN ke login
    res.redirect('/admin-dashboard');
});

module.exports = app; // Penting untuk Vercel

