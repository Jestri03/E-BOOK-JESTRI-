const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

const mongoURI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';

mongoose.connect(mongoURI).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: String, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

app.get('/', async (req, res) => {
    try {
        const buku = await Buku.find();
        res.render('index', { buku });
    } catch (e) { res.send("Database lagi loading, refresh aja."); }
});

app.get('/login', (req, res) => res.render('login'));
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/jestri-control');
    } else { res.send("Salah!"); }
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const buku = await Buku.find();
    res.render('admin', { buku });
});

app.post('/tambah-buku', async (req, res) => {
    if (req.session.admin) await new Buku(req.body).save();
    res.redirect('/jestri-control');
});

module.exports = app;

