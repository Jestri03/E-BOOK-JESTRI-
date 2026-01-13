const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Database sementara
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Pengaturan Sesi
app.use(session({
    secret: 'jestri-secret-key',
    resave: false,
    saveUninitialized: true
}));

const upload = multer({ dest: '/tmp/' });

// --- ROUTES ---

// Halaman Utama (Dashboard yang sudah jadi)
app.get('/', (req, res) => {
    try {
        const data = fs.readFileSync(booksPath, 'utf8');
        const books = JSON.parse(data);
        res.render('index', { books });
    } catch (err) {
        res.render('index', { books: [] });
    }
});

// Halaman Login Admin (Tampilan Bagus)
app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login' });
});

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'jestri123') {
        req.session.isAdmin = true;
        return res.redirect('/admin-dashboard');
    }
    res.send('<script>alert("Password Salah!"); window.location="/login-admin";</script>');
});

// Halaman Dashboard Admin
app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('admin', { mode: 'dashboard', books });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('Server Running'));
module.exports = app;

