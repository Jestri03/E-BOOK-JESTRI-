const express = require('express');
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// LINK KONEKSI MONGODB JESTRI
const mongoURI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
    .then(() => console.log('Database Connected'))
    .catch(err => console.log('DB Error: ' + err));

const Buku = mongoose.model('Buku', {
    judul: String, penulis: String, harga: String, gambar: String
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
    name: 'session',
    keys: ['secret-jestri'],
    maxAge: 24 * 60 * 60 * 1000 
}));

app.get('/', async (req, res) => {
    try {
        const dataBuku = await Buku.find();
        res.render('index', { buku: dataBuku });
    } catch (err) {
        res.send("Gagal memuat data. Coba refresh halaman.");
    }
});

app.get('/login', (req, res) => res.render('login'));

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/login';</script>");
    }
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    const dataBuku = await Buku.find();
    res.render('admin', { buku: dataBuku });
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

module.exports = app;

