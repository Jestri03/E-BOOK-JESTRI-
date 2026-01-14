const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
    name: 'session',
    keys: ['jestri-secret-key'],
    maxAge: 24 * 60 * 60 * 1000 
}));

// Tampilan Pembeli
app.get('/', (req, res) => { res.render('index'); });

// Halaman Login Admin
app.get('/login', (req, res) => { res.render('login'); });

// Proses Login (Cukup Password Saja)
app.post('/admin-dashboard', (req, res) => {
    const { password } = req.body;
    if (password === 'JESTRI0301209') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/login';</script>");
    }
});

// Panel Kontrol Admin
app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.render('admin', { buku: [] }); 
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Ready'));
module.exports = app;

