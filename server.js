const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'jestri-secret', resave: false, saveUninitialized: true }));

const upload = multer({ dest: '/tmp/' });

// HALAMAN UTAMA
app.get('/', (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath));
        res.render('index', { books });
    } catch (err) { res.render('index', { books: [] }); }
});

// LOGIN ADMIN (Menggunakan admin.ejs sesuai file kamu)
app.get('/login-admin', (req, res) => {
    res.render('admin'); 
});

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'jestri123') {
        req.session.isAdmin = true;
        return res.redirect('/admin-dashboard');
    }
    res.send('Password salah! <a href="/login-admin">Kembali</a>');
});

// DASHBOARD ADMIN
app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    // Kita gunakan admin.ejs juga atau buat file baru
    res.render('admin', { books, mode: 'dashboard' }); 
});

app.listen(PORT, () => console.log('Server Ready'));
module.exports = app;

