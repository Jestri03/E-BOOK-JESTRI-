const express = require('express');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Konfigurasi Session agar login tidak hilang saat tambah/hapus
app.use(session({
    secret: 'jestri-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Sesi aktif 1 jam
}));

// Route Login (Halaman)
app.get('/login', (req, res) => {
    res.render('login');
});

// Proses Login
app.post('/login-proses', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control'); // Redirect ke dashboard
    } else {
        res.send("Login Gagal! <a href='/login'>Coba Lagi</a>");
    }
});

// Dashboard Admin
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Asumsikan 'buku' adalah data dari database Anda
    res.render('admin', { buku: [] }); 
});

// Proses Tambah Buku (Kunci agar tidak logout)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Logika simpan database Anda di sini...
    
    // SETELAH BERHASIL: Kembali ke dashboard, BUKAN login
    res.redirect('/jestri-control');
});

// Proses Hapus Buku
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Logika hapus database Anda di sini...
    
    res.redirect('/jestri-control');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
module.exports = app;

