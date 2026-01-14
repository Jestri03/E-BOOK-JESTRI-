const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

// Konfigurasi Standar
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Ganti express-session dengan cookie-session (Lebih stabil di Vercel)
app.use(cookieSession({
    name: 'session',
    keys: ['jestri-secret-key'],
    maxAge: 24 * 60 * 60 * 1000 // Sesi 24 jam
}));

// ==========================================
// 1. TAMPILAN PEMBELI (SESUAI VIDEO LO)
// ==========================================
app.get('/', (req, res) => {
    // Memanggil index.ejs agar menu genre lo muncul lagi
    res.render('index'); 
});

// ==========================================
// 2. TAMPILAN ADMIN (JESTRI CONTROL)
// ==========================================
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Gagal! <a href='/login'>Balik</a>");
    }
});

app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Buku diisi [] agar tabel tidak error saat awal kosong
    res.render('admin', { buku: [] }); 
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Ready!'));

module.exports = app;

