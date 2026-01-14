const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Pake cookie-session biar gak "Internal Server Error" di Vercel
app.use(cookieSession({
    name: 'session',
    keys: ['jestri-secret-key'],
    maxAge: 24 * 60 * 60 * 1000
}));

// ==========================================
// 1. TAMPILAN PEMBELI (Sesuai Video Lo)
// ==========================================
app.get('/', (req, res) => {
    // Memanggil index.ejs (Menu genre lo ada di sini)
    res.render('index'); 
});

// ==========================================
// 2. TAMPILAN ADMIN
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

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Ready!'));

module.exports = app;

