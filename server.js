const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Data Buku
const books = [{ 
    id: "1", 
    title: "The Psychology of Money", 
    price: "2.800", 
    image: "https://i.ibb.co/LzNfXf0/1000715150.jpg",
    description: "Penulis: Morgan Housel"
}];

app.get('/', (req, res) => {
    res.render('index', { books: books });
});

app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login' });
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'menu-selection' });
    } else {
        res.send("Password Salah!");
    }
});

app.get('/admin/katalog', (req, res) => res.render('admin', { mode: 'katalog', books: books }));
app.get('/admin/watermark-lab', (req, res) => res.render('admin', { mode: 'watermark-lab' }));

module.exports = app;

