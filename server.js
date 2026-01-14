const express = require('express');
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// --- KONEKSI DATABASE (Password & Nama Database Sudah Diatur) ---
const mongoURI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
    .then(() => console.log('Database Connected!'))
    .catch(err => console.error('MongoDB Error:', err));

// Skema Data Buku
const Buku = mongoose.model('Buku', {
    judul: String, 
    penulis: String, 
    harga: String, 
    gambar: String
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Session agar stabil di Vercel (Pake Cookie Session)
app.use(cookieSession({
    name: 'session',
    keys: ['jestri-secret-key'],
    maxAge: 24 * 60 * 60 * 1000 
}));

// --- 1. RUTE PEMBELI (Halaman Utama) ---
app.get('/', async (req, res) => {
    try {
        const listBuku = await Buku.find();
        res.render('index', { buku: listBuku });
    } catch (err) {
        res.send("Error memuat data pembeli");
    }
});

// --- 2. LOGIN ADMIN (Hanya Password: JESTRI0301209) ---
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/admin-dashboard', (req, res) => {
    const { password } = req.body;
    if (password === 'JESTRI0301209') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/login';</script>");
    }
});

// --- 3. DASHBOARD ADMIN (Tambah/Hapus Buku) ---
app.get('/jestri-control', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    try {
        const listBuku = await Buku.find();
        res.render('admin', { buku: listBuku });
    } catch (err) {
        res.send("Gagal memuat dashboard admin");
    }
});

app.post('/tambah-buku', async (req, res) => {
    if (!req.session.isLoggedIn) return res.sendStatus(403);
    try {
        const { judul, penulis, harga, gambar } = req.body;
        await new Buku({ judul, penulis, harga, gambar }).save();
        res.redirect('/jestri-control');
    } catch (err) {
        res.send("Gagal menambah buku");
    }
});

app.get('/hapus-buku/:id', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    try {
        await Buku.findByIdAndDelete(req.params.id);
        res.redirect('/jestri-control');
    } catch (err) {
        res.send("Gagal menghapus buku");
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Ready on Port ' + PORT));

module.exports = app;

