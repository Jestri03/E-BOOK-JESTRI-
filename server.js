const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Middleware agar form & json terbaca
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session (Kunci agar tidak Internal Server Error)
app.use(session({
    secret: 'jestri-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// ==========================================
// 1. TAMPILAN PEMBELI (Sesuai Video Lo)
// ==========================================
app.get('/', (req, res) => {
    // Memanggil index.ejs agar menu genre & pencarian lo muncul
    res.render('index'); 
});

// ==========================================
// 2. TAMPILAN ADMIN (Jestri Control)
// ==========================================
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
    res.redirect('/jestri-control'); 
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Running...'));

module.exports = app;

