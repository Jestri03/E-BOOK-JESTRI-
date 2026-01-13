const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Database Buku Sementara (Disimpan di RAM)
let BOOKS = [
    { id: 1, title: "Tan Malaka - MADILOG", author: "Rowland Book", price: "2.700", image: "https://via.placeholder.com/150" }
];

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

// Tambah Buku menggunakan Link URL Gambar (Agar Vercel tidak Error 500)
app.post('/add-book', (req, res) => {
    const { title, author, price, imageUrl } = req.body;
    BOOKS.push({
        id: Date.now(),
        title: title,
        author: author,
        price: price, 
        image: imageUrl || "https://via.placeholder.com/150"
    });
    res.send("<script>alert('Buku Berhasil Ditambah!'); window.location='/jestri-control';</script>");
});

app.get('/delete-book/:id', (req, res) => {
    BOOKS = BOOKS.filter(b => b.id != req.params.id);
    res.redirect('/jestri-control');
});

app.get('/jestri-lab', (req, res) => { res.render('lab'); });

module.exports = app;

