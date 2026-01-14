const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Kunci utama agar tidak Internal Server Error di Vercel
app.use(cookieSession({
    name: 'session',
    keys: ['jestri-secret-0301'],
    maxAge: 24 * 60 * 60 * 1000
}));

// --- 1. MODE PEMBELI ---
app.get('/', (req, res) => {
    res.render('index'); 
});

// --- 2. LOGIN ADMIN (PASSWORD ONLY: JESTRI0301209) ---
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

// --- 3. DASHBOARD ADMIN KEREN (/jestri-control) ---
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Contoh data buku, lo bisa ganti dengan database nanti
    const buku = []; 
    res.render('admin', { buku });
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Ready'));
module.exports = app;

