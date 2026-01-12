onst express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Path Database Sementara di Vercel
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) {
    fs.writeFileSync(booksPath, JSON.stringify([]));
}

// PENTING: Pengaturan Folder Views agar tidak Error 500
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static(path.join(process.cwd(), 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'jestri-secret',
    resave: false,
    saveUninitialized: true
}));

const upload = multer({ dest: '/tmp/' });

// Route Halaman Utama
app.get('/', (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath));
        res.render('index', { books });
    } catch (err) {
        res.render('index', { books: [] });
    }
});

// Route Login
app.get('/login-admin', (req, res) => {
    res.render('admin-login');
});

app.post('/login-admin', (req, res) => {
    const { password } = req.body;
    if (password === 'jestri123') {
        req.session.isAdmin = true;
        res.redirect('/admin-dashboard');
    } else {
        res.send('Password Salah! <a href="/login-admin">Kembali</a>');
    }
});

// Route Dashboard
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

// Export untuk Vercel
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

