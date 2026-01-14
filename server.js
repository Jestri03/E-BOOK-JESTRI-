const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

const mongoURI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';

mongoose.connect(mongoURI).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

app.get('/', async (req, res) => {
    try {
        const data = await Buku.find();
        res.render('index', { buku: data });
    } catch (e) { res.send("Error Database"); }
});

app.get('/login', (req, res) => res.render('login'));
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/jestri-control');
    } else { res.send("Password Salah!"); }
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find();
    res.render('admin', { buku: data });
});

app.post('/tambah-buku', async (req, res) => {
    if (req.session.admin) {
        await new Buku({ 
            judul: req.body.judul, 
            penulis: req.body.penulis, 
            harga: Number(req.body.harga), 
            gambar: req.body.gambar 
        }).save();
    }
    res.redirect('/jestri-control');
});

app.get('/hapus-buku/:id', async (req, res) => {
    if (req.session.admin) await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/jestri-control');
});

module.exports = app;

