const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi Database Sementara untuk Vercel
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) {
    fs.writeFileSync(booksPath, JSON.stringify([]));
}

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'jestri-secret',
    resave: false,
    saveUninitialized: true
}));

// Konfigurasi Upload Gambar (ke /tmp agar tidak error di Vercel)
const upload = multer({ dest: '/tmp/' });

// Route Halaman Utama
app.get('/', (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('index', { books });
});

// Route Login Admin
app.get('/login-admin', (req, res) => {
    res.render('admin-login');
});

app.post('/login-admin', (req, res) => {
    const { password } = req.body;
    if (password === 'jestri123') { // Ganti password di sini
        req.session.isAdmin = true;
        res.redirect('/admin-dashboard');
    } else {
        res.send('Password Salah!');
    }
});

// Route Dashboard Admin
app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('admin-dashboard', { books });
});

// Route Tambah Buku
app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const { title, price, description } = req.body;
    const books = JSON.parse(fs.readFileSync(booksPath));
    
    books.push({
        id: Date.now(),
        title,
        price,
        description,
        image: req.file ? req.file.filename : ''
    });

    fs.writeFileSync(booksPath, JSON.stringify(books));
    res.redirect('/admin-dashboard');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

