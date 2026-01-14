const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Menggunakan cookie-session agar stabil di Vercel
app.use(cookieSession({
    name: 'session',
    keys: ['jestri-secret-key-0301'],
    maxAge: 24 * 60 * 60 * 1000 
}));

// TAMPILAN PEMBELI (Halaman Utama)
app.get('/', (req, res) => { res.render('index'); });

// HALAMAN LOGIN (Tampilan Keren)
app.get('/login', (req, res) => { res.render('login'); });

// PROSES LOGIN (Hanya Password)
app.post('/admin-dashboard', (req, res) => {
    const { password } = req.body;
    if (password === 'JESTRI0301209') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/login';</script>");
    }
});

// DASHBOARD ADMIN
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.render('admin', { buku: [] }); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Ready'));
module.exports = app;

