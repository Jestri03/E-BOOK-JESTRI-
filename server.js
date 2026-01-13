const express = require('express');
const session = require('express-session');
const app = express();

// Middleware agar server bisa baca input form
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// 1. PENGATURAN SESSION (Kunci agar tidak logout sendiri)
app.use(session({
    secret: 'jestri-super-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // Sesi bertahan 1 jam
}));

// 2. ROUTE LOGIN
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login-proses', (req, res) => {
    const { username, password } = req.body;
    // Ganti admin123 dengan password Anda
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control'); 
    } else {
        res.send("Login Gagal! <a href='/login'>Coba Lagi</a>");
    }
});

// 3. ROUTE DASHBOARD (Pusat Kendali)
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Contoh data buku (Nanti hubungkan ke database Anda)
    const daftar_buku = [
        { id: 1, judul: "Buku Contoh", harga: "50000" }
    ];
    
    res.render('admin', { buku: daftar_buku }); 
});

// 4. ROUTE TAMBAH BUKU
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    // Logika simpan database Anda di sini (misal: db.query...)
    console.log("Buku berhasil ditambah:", req.body.judul);
    
    // KUNCI: Redirect kembali ke dashboard, bukan ke login
    res.redirect('/jestri-control');
});

// 5. ROUTE HAPUS BUKU
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    
    const idBuku = req.params.id;
    console.log("Buku dihapus id:", idBuku);

    res.redirect('/jestri-control');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server nyala di http://localhost:${PORT}`));

module.exports = app;

