const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: '/tmp/' });

// FUNGSI PENGUNCI (Hanya kamu yang tahu passwordnya)
const protect = (req, res, next) => {
    const auth = { login: 'admin', password: 'jestri123' };
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Wajib Login! Masukkan username: admin dan password kamu.');
};

// 1. Halaman Utama (Tetap Aman, Tidak Berubah)
app.get('/', (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('index', { books });
});

// 2. Link Admin Terkunci (Hanya bisa dibuka jika login benar)
app.get('/login-admin', protect, (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('admin', { mode: 'dashboard', books }); 
});

// 3. Link Dashboard Terkunci
app.get('/admin-dashboard', protect, (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('admin', { mode: 'dashboard', books });
});

app.post('/add-book', protect, upload.single('image'), (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath));
    books.push({
        id: Date.now(),
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
        image: req.file ? req.file.filename : ''
    });
    fs.writeFileSync(booksPath, JSON.stringify(books));
    res.redirect('/admin-dashboard');
});

app.listen(PORT, () => console.log('Sistem Keamanan Terkunci'));
module.exports = app;

