const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // Untuk CSS/Gambar

// Konfigurasi Session
app.use(session({
    secret: 'jestri-ebook-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

// --- ROUTES ---

// 1. Halaman Utama (Tampilan User seperti di video)
app.get('/', (req, res) => {
    // Ganti 'index' dengan nama file ejs tampilan utama lo
    res.render('index', { buku: [] }); 
});

// 2. Login Admin
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Login Gagal! <a href='/login'>Kembali</a>");
    }
});

// 3. Dashboard Admin (Sesuai error 'Cannot GET /jestri-control')
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.render('admin', { buku: [] }); // Ganti [] dengan data dari DB nanti
});

// 4. Proses Tambah Buku (Biar gak balik ke login)
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Logika simpan DB di sini
    res.redirect('/jestri-control'); // Balik ke dashboard admin
});

// 5. Proses Hapus Buku
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Logika hapus DB di sini
    res.redirect('/jestri-control');
});

// 6. Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));

module.exports = app;

