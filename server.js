const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Fix Internal Server Error
app.use(session({
    secret: 'jestri-ebook-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// --- TAMPILAN PEMBELI (TETAP SESUAI VIDEO) ---
app.get('/', (req, res) => {
    // Memanggil index.ejs (Menu Genre lo aman di sini)
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

