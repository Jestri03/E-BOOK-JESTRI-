onst express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression'); // Mempercepat loading

const app = express();
const PORT = process.env.PORT || 3000;

// Path Database Aman
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

// PENGUATAN SISTEM & OPTIMALISASI
app.use(compression()); // Kompres data agar website sangat cepat
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' })); // Cache gambar agar cepat
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// KEAMANAN SESI TINGGI
app.use(session({
    secret: 'Super-Secret-Jestri-2026-Security',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set 'true' jika sudah pakai HTTPS permanen
        httpOnly: true, // Mencegah hacker mencuri session lewat script
        maxAge: 3600000 // 1 jam sesi aktif
    }
}));

const upload = multer({ dest: '/tmp/' });

// MIDDLEWARE: Proteksi Admin (Kunci Paling Kuat)
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect('/login-admin');
};

// --- ROUTES ---

app.get('/', (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        const { genre, search } = req.query;
        let filteredBooks = books;

        if (genre && genre !== 'Semua Buku') filteredBooks = filteredBooks.filter(b => b.genre === genre);
        if (search) filteredBooks = filteredBooks.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

        res.render('index', { books: filteredBooks });
    } catch (e) { res.render('index', { books: [] }); }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', (req, res) => {
    // PASSWORD BARU KAMU
    const passInput = req.body.password;
    if (passInput === 'JESTRI0301209') {
        req.session.isAdmin = true;
        return res.redirect('/admin-dashboard');
    }
    res.send('<script>alert("AKSES DITOLAK: Password Salah!"); window.location="/login-admin";</script>');
});

app.get('/admin-dashboard', isAdmin, (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    res.render('admin', { mode: 'dashboard', books });
});

app.post('/add-book', isAdmin, upload.single('image'), (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        books.push({
            id: Date.now(),
            title: req.body.title,
            genre: req.body.genre,
            price: req.body.price,
            description: req.body.description || 'Admin',
            image: req.file ? req.file.filename : ''
        });
        fs.writeFileSync(booksPath, JSON.stringify(books));
        res.redirect('/admin-dashboard');
    } catch (err) { res.send('Error saving data.'); }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('Sistem Aman & Cepat Aktif'));
module.exports = app;

