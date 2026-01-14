const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Konfigurasi Standar
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Fix Internal Server Error dengan konfigurasi session yang benar
app.use(session({
    secret: 'jestri-ebook-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// --- MODE PEMBELI: SESUAI VIDEO LO ---
app.get('/', (req, res) => {
    // Memanggil index.ejs (Tampilan genre lo tetap aman)
    res.render('index'); 
});

// --- MODE ADMIN: JESTRI CONTROL ---
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Gagal! <a href='/login'>Balik</a>");
    }
});

app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.render('admin', { buku: [] }); 
});

app.post('/tambah-buku', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Logika simpan lo
    res.redirect('/jestri-control'); 
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Ready'));

module.exports = app;

