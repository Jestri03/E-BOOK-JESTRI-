const express = require('express');
const session = require('express-session');
const app = express();

// 1. Middleware untuk membaca data dari form (WAJIB)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

// 2. Konfigurasi Session (Agar tidak logout otomatis)
app.use(session({
    secret: 'jestri_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set ke true hanya jika menggunakan HTTPS
        maxAge: 24 * 60 * 60 * 1000 // Aktif selama 24 jam
    }
}));

// 3. Middleware Proteksi Admin
const isAdmin = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

// --- ROUTES ---

// Halaman Login
app.get('/login', (req, res) => {
    res.render('login'); 
});

// Proses Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Sesuaikan username/pass Anda
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control'); // Redirect ke dashboard setelah login
    } else {
        res.send("Login gagal. <a href='/login'>Coba lagi</a>");
    }
});

// Halaman Dashboard Admin
app.get('/jestri-control', isAdmin, (req, res) => {
    // Di sini biasanya Anda memanggil data dari DB (misal variabel 'books')
    // res.render('admin', { books: result });
    res.render('admin'); 
});

// Proses Tambah Buku
app.post('/tambah-buku', isAdmin, (req, res) => {
    // --- LOGIKA DATABASE ANDA DI SINI ---
    // Contoh: db.query("INSERT INTO...", (err) => { ... })
    
    // SESUDAH BERHASIL: Kembali ke dashboard admin, BUKAN ke login!
    res.redirect('/jestri-control');
});

// Proses Hapus Buku
app.get('/hapus-buku/:id', isAdmin, (req, res) => {
    // --- LOGIKA DATABASE ANDA DI SINI ---
    
    // SESUDAH BERHASIL: Kembali ke dashboard admin
    res.redirect('/jestri-control');
});

// Route Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Menangani Error 404 (Route tidak ditemukan)
app.use((req, res) => {
    res.status(404).send("Halaman tidak ditemukan. Coba cek route di server.js");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

module.exports = app; // Penting untuk Vercel

