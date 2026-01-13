const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();

// Konfigurasi penyimpanan gambar di folder public/uploads
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Database Buku Sementara
let BOOKS = [
    { id: 1, title: "The Psychology of Money", author: "Morgan Housel", price: "2.800", image: "https://via.placeholder.com/150" }
];

// --- 1. HALAMAN UTAMA ---
app.get('/', (req, res) => {
    res.render('index', { books: BOOKS });
});

// --- 2. HALAMAN ADMIN ---
app.get('/jestri-control', (req, res) => {
    res.render('admin', { mode: 'login' });
});

// Login Langsung ke Form Tambah/Hapus
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'katalog', books: BOOKS });
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/jestri-control';</script>");
    }
});

// Tambah Buku (Support Upload Galeri & Harga Titik/Koma)
app.post('/add-book', upload.single('image'), (req, res) => {
    const { title, author, price } = req.body;
    const newBook = {
        id: Date.now(),
        title: title,
        author: author,
        price: price, // Sekarang bisa menerima format 2.700
        image: req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/150"
    };
    BOOKS.push(newBook);
    res.send("<script>alert('Buku Berhasil Ditambah!'); window.location='/jestri-control';</script>");
});

// Hapus Buku
app.get('/delete-book/:id', (req, res) => {
    BOOKS = BOOKS.filter(b => b.id != req.params.id);
    res.send("<script>alert('Buku Dihapus!'); window.location='/jestri-control';</script>");
});

// --- 3. WATERMARK LAB ---
app.get('/jestri-lab', (req, res) => {
    res.render('lab');
});

module.exports = app;

