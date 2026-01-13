const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 1. HALAMAN PEMBELI
app.get('/', (req, res) => {
    res.render('index');
});

// 2. HALAMAN ADMIN (Tambah/Hapus Buku)
app.get('/jestri-control', (req, res) => {
    res.render('admin', { mode: 'login' });
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'katalog', books: [] });
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/jestri-control';</script>");
    }
});

// 3. HALAMAN WATERMARK LAB (Link Rahasia Baru)
app.get('/jestri-lab', (req, res) => {
    res.render('lab');
});

module.exports = app;

