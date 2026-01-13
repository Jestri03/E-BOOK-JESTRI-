const express = require('express');
const session = require('express-session');
const app = express();

// Konfigurasi agar bisa membaca data dari form
app.use(express.urlencoded({ extended: true }));

// Pengaturan Session agar login tidak hilang
app.use(session({
    secret: 'kunci_rahasia_jestri',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // Aktif selama 1 jam
}));

// --- ROUTE LOGIN ---
app.get('/login', (req, res) => {
    res.render('login'); // Pastikan ada file views/login.ejs
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Ganti dengan username & password Anda
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/jestri-control'); // Diarahkan ke dashboard
    } else {
        res.send("Login Gagal! <a href='/login'>Kembali</a>");
    }
});

// --- ROUTE DASHBOARD (Gunakan /jestri-control sesuai error Anda) ---
app.get('/jestri-control', (req, res) => {
    if (req.session.isAdmin) {
        // Ambil data buku dari database Anda di sini
        res.render('admin'); // Membuka views/admin.ejs
    } else {
        res.redirect('/login');
    }
});

// --- ROUTE TAMBAH BUKU (Mencegah terlempar ke login) ---
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');

    // Proses simpan buku ke database...
    
    // SETELAH BERHASIL: Kembali ke dashboard, BUKAN ke login
    res.redirect('/jestri-control');
});

// --- ROUTE HAPUS BUKU ---
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login');

    // Proses hapus buku dari database...

    res.redirect('/jestri-control');
});

// Penting untuk Vercel
module.exports = app;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

