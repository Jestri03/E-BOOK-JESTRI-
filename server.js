const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Session agar admin tidak logout otomatis
app.use(session({
    secret: 'jestri-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

// --- MODE PEMBELI (TIDAK DIUBAH) ---
app.get('/', (req, res) => {
    res.render('index'); // Pastikan file tampilan pembeli lo namanya index.ejs
});

// --- MODE ADMIN (PERBAIKAN) ---

// 1. Halaman Login
app.get('/login', (req, res) => {
    res.render('login');
});

// 2. Proses Login (Fix: "Cannot POST /admin-dashboard")
// Jika di form login lo action="/admin-dashboard", maka pake rute ini:
app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control'); // Pindah ke panel kontrol
    } else {
        res.send("Login Gagal! <a href='/login'>Kembali</a>");
    }
});

// 3. Panel Kontrol (Fix: "Cannot GET /jestri-control")
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Kirim data buku kosong dulu agar tidak error saat render
    res.render('admin', { buku: [] }); 
});

// 4. Proses Tambah Buku (Fix: Logout setelah tambah)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Logika simpan database lo di sini
    
    // SETELAH BERHASIL: Balik ke panel kontrol, BUKAN ke login
    res.redirect('/jestri-control');
});

// 5. Proses Hapus Buku
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.redirect('/jestri-control');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));

module.exports = app;

