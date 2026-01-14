const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

const mongoURI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';

// Koneksi Database dengan opsi stabil
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('DB Connect'))
    .catch(err => console.log('DB Error: ' + err));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String 
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

app.use(cookieSession({ 
    name: 'session', 
    keys: ['jestri-secret'], 
    maxAge: 24 * 60 * 60 * 1000 
}));

// HALAMAN UTAMA
app.get('/', async (req, res) => {
    try {
        const data = await Buku.find() || [];
        res.render('index', { buku: data });
    } catch (e) {
        res.render('index', { buku: [] });
    }
});

// LOGIN
app.get('/login', (req, res) => res.render('login'));
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Password Salah!");
    }
});

// ADMIN
app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    res.render('admin', { buku: data });
});

app.post('/tambah-buku', async (req, res) => {
    if (req.session.admin) {
        const { judul, penulis, harga, gambar } = req.body;
        await new Buku({ judul, penulis, harga: Number(harga), gambar }).save();
    }
    res.redirect('/jestri-control');
});

app.get('/hapus-buku/:id', async (req, res) => {
    if (req.session.admin) await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/jestri-control');
});

module.exports = app;

