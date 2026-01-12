onst express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi Database Sementara (Vercel menggunakan /tmp)
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) {
    fs.writeFileSync(booksPath, JSON.stringify([]));
}

// Pengaturan Tampilan (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Sesi Admin
app.use(session({
    secret: 'jestri-secret',
    resave: false,
    saveUninitialized: true
}));

// Folder Upload Gambar Sementara
const upload = multer({ dest: '/tmp/' });

// HALAMAN UTAMA - Menampilkan Katalog
app.get('/', (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath));
        res.render('index', { books });
    } catch (err) {
        res.render('index', { books: [] });
    }
});

// HALAMAN LOGIN ADMIN
app.get('/login-admin', (req, res) => {
    res.render('admin-login');
});

app.post('/login-admin', (req, res) => {
    const { password } = req.body;
    if (password === 'jestri123') {
        req.session.isAdmin = true;
        res.redirect('/admin-dashboard');
    } else {
        res.send('Password salah! <a href="/login-admin">Kembali</a>');
    }
});

// HALAMAN DASHBOARD ADMIN
app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    const books = JSON.parse(fs.readFileSync(booksPath));
    res.render('admin-dashboard', { books });
});

// PROSES TAMBAH BUKU
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

// PENTING UNTUK VERCEL
app.listen(PORT, () => {
    console.log(`Server nyala di port ${PORT}`);
});

module.exports = app;

