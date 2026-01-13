const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();

const upload = multer({ dest: 'public/uploads/' });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

let BOOKS = []; // Data buku sementara

app.get('/', (req, res) => {
    res.render('index', { books: BOOKS });
});

app.get('/jestri-control', (req, res) => {
    res.render('admin', { mode: 'login' });
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'katalog', books: BOOKS });
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/jestri-control';</script>");
    }
});

app.post('/add-book', upload.single('image'), (req, res) => {
    const { title, author, price } = req.body;
    BOOKS.push({
        id: Date.now(),
        title,
        author,
        price, // Tersimpan sebagai string (teks)
        image: req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/150"
    });
    res.redirect('/jestri-control');
});

app.get('/delete-book/:id', (req, res) => {
    BOOKS = BOOKS.filter(b => b.id != req.params.id);
    res.redirect('/jestri-control');
});

app.get('/jestri-lab', (req, res) => { res.render('lab'); });

module.exports = app;

