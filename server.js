const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Session agar Internal Server Error Hilang
app.use(session({
    secret: 'jestri-ebook-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// --- MODE PEMBELI (Tampilan di Video Lo) ---
app.get('/', (req, res) => {
    // Memanggil index.ejs agar menu genre muncul kembali
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
        res.send("Gagal! <a href='/login'>Balik</a>");
    }
});

app.get('/jestri-control', (req, res) => {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    res.render('admin', { buku: [] }); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Ready'));

module.exports = app;

