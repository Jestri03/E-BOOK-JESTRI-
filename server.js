const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Pengaturan Session (Kunci biar nggak logout sendiri)
app.use(session({
    secret: 'jestri-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Sesi 1 jam
}));

// --- ROUTES ---

// 1. Route Beranda (Biar nggak "Cannot GET /")
app.get('/', (req, res) => {
    res.redirect('/login');
});

// 2. Route Login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Ganti sesuai keinginan lu
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control'); 
    } else {
        res.send("Login Gagal! <a href='/login'>Balik lagi</a>");
    }
});

// 3. Route Dashboard (Sesuai error "Cannot GET /jestri-control")
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Ini contoh data, nanti sambungin ke DB lu
    const dataBuku = [
        { id: 1, judul: "Buku Sakti", harga: "50000" }
    ];
    
    res.render('admin', { buku: dataBuku });
});

// 4. Route Tambah Buku
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // --- Proses Simpan ke Database Lu di Sini ---
    console.log("Nambah buku:", req.body.judul);

    // BALIK KE DASHBOARD, BUKAN LOGIN
    res.redirect('/jestri-control');
});

// 5. Route Hapus Buku
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    console.log("Hapus ID:", req.params.id);

    res.redirect('/jestri-control');
});

// 6. Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));

module.exports = app;

