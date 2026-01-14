const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
    name: 'session',
    keys: ['jestri-secret-0301'],
    maxAge: 24 * 60 * 60 * 1000
}));

// DATABASE SEMENTARA (Akan reset kalau server restart, tapi aman buat testing)
let daftarBuku = [];

app.get('/', (req, res) => { res.render('index', { buku: daftarBuku }); });
app.get('/login', (req, res) => { res.render('login'); });

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("<script>alert('Salah!'); window.location='/login';</script>");
    }
});

// HALAMAN ADMIN
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.render('admin', { buku: daftarBuku });
});

// FITUR TAMBAH BUKU
app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.sendStatus(403);
    const { judul, penulis, harga, gambar } = req.body;
    daftarBuku.push({ id: Date.now(), judul, penulis, harga, gambar });
    res.redirect('/jestri-control');
});

// FITUR HAPUS BUKU
app.get('/hapus-buku/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    daftarBuku = daftarBuku.filter(b => b.id != req.params.id);
    res.redirect('/jestri-control');
});

app.get('/logout', (req, res) => { req.session = null; res.redirect('/'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Ready'));
module.exports = app;

