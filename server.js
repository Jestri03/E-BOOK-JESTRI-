const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

// Konfigurasi View Engine & Static Files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sesi menggunakan cookie-session agar tidak crash di Vercel
app.use(cookieSession({
    name: 'session',
    keys: ['jestri-key-rahasia'],
    maxAge: 24 * 60 * 60 * 1000 // 24 jam
}));

// --- TAMPILAN PEMBELI (Pastikan index.ejs ada di folder views) ---
app.get('/', (req, res) => {
    res.render('index'); 
});

// --- TAMPILAN ADMIN ---
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Gagal login! <a href='/login'>Balik</a>");
    }
});

app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.render('admin', { buku: [] }); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Jalan...'));

module.exports = app;

