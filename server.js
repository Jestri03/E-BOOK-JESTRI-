onst express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const app = express();

// Konfigurasi
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Ganti express-session ke cookie-session biar gak Internal Server Error di Vercel
app.use(cookieSession({
    name: 'session',
    keys: ['jestri-secret-key-123'],
    maxAge: 24 * 60 * 60 * 1000 // Aktif 24 jam
}));

// --- MODE PEMBELI (Tampilan menu genre lo di video) ---
app.get('/', (req, res) => {
    res.render('index'); 
});

// --- MODE ADMIN ---
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/admin-dashboard', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        res.redirect('/jestri-control');
    } else {
        res.send("Gagal login! <a href='/login'>Kembali</a>");
    }
});

app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    // Buku diisi array kosong [] biar tabel admin lo gak error pas awal
    res.render('admin', { buku: [] }); 
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server Jestri Ready!'));

module.exports = app;

