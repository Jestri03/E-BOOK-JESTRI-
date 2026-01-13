const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Gunakan folder /tmp untuk database di Vercel
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) {
    fs.writeFileSync(booksPath, JSON.stringify([]));
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('/tmp'));

app.use(session({
    secret: 'jestri-secret-key',
    resave: false,
    saveUninitialized: true
}));

const upload = multer({ dest: '/tmp/' });

// --- ROUTES ---

app.get('/', (req, res) => {
    try {
        const data = fs.readFileSync(booksPath, 'utf8');
        let books = JSON.parse(data);
        
        // Logika Filter Genre & Search
        const { genre, search } = req.query;
        if (genre && genre !== 'Semua Buku') {
            books = books.filter(b => b.genre === genre);
        }
        if (search) {
            books = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
        }

        res.render('index', { books });
    } catch (err) {
        res.render('index', { books: [] });
    }
});

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

app.get('/admin-dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/login-admin');
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        res.render('admin', { mode: 'dashboard', books });
    } catch (err) {
        res.render('admin', { mode: 'dashboard', books: [] });
    }
});

app.post('/add-book', upload.single('image'), (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send('Forbidden');
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        books.push({
            id: Date.now(),
            title: req.body.title,
            genre: req.body.genre,
            price: req.body.price,
            description: req.body.description || 'Penulis',
            image: req.file ? req.file.filename : ''
        });
        fs.writeFileSync(booksPath, JSON.stringify(books));
        res.redirect('/admin-dashboard');
    } catch (err) {
        res.send('Gagal menyimpan buku');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;

