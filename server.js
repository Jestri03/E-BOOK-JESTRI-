const express = require('express');
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// LINK KONEKSI JESTRI (Pastikan tercopy semua sampai akhir)
const mongoURI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority&appName=Cluster0';

// Koneksi Database dengan Pengaman
mongoose.connect(mongoURI)
    .then(() => console.log('Database OK!'))
    .catch(err => console.error('Database Error:', err));

const Buku = mongoose.model('Buku', {
    judul: String, penulis: String, harga: String, gambar: String
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
    name: 'session',
    keys: ['jestri-rahasia-banget'],
    maxAge: 24 * 60 * 60 * 1000 
}));

// Rute Utama (Halaman Pembeli)
app.get('/', async (req, res) => {
    try {
        const dataBuku = await Buku.find() || [];
        res.render('index', { buku: dataBuku });
    } catch (err) {
        res.status(500).send("Sabar Bro, Database lagi loading. Coba Refresh.");
    }
});

// Login Admin
app.get('/login', (req, res) => res.render('login'));
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/login';</script>");
    }
});

// Dashboard CRUD
app.get('/jestri-control', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    try {
        const dataBuku = await Buku.find() || [];
        res.render('admin', { buku: dataBuku });
    } catch (err) {
        res.send("Gagal buka dashboard");
    }
});

app.post('/tambah-buku', async (req, res) => {
    if (!req.session.isLoggedIn) return res.sendStatus(403);
    await new Buku(req.body).save();
    res.redirect('/jestri-control');
});

app.get('/hapus-buku/:id', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/jestri-control');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Gas Pol!'));
module.exports = app;

