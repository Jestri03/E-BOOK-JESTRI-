const express = require('express');
const path = require('path');
const multer = require('multer'); // Untuk handle upload gambar dari galeri
const app = express();

// Konfigurasi Folder Upload (Sementara)
const upload = multer({ dest: 'public/uploads/' });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// DATABASE SEMENTARA (Data akan hilang jika server restart, gunakan database asli jika ingin permanen)
let BOOKS = [
    { id: 1, title: "The Psychology of Money", author: "Morgan Housel", price: "2.800", image: "https://via.placeholder.com/150" }
];

// --- 1. HALAMAN PEMBELI (HOME) ---
app.get('/', (req, res) => {
    res.render('index', { books: BOOKS });
});

// --- 2. HALAMAN ADMIN (JESTRI CONTROL) ---
app.get('/jestri-control', (req, res) => {
    res.render('admin', { mode: 'login' });
});

// Proses Login Langsung ke Dashboard Tambah/Hapus
app.post('/admin-dashboard', (req, res) => {
    const pass = req.body.password;
    if (pass === 'JESTRI0301209') {
        res.render('admin', { mode: 'katalog', books: BOOKS });
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/jestri-control';</script>");
    }
});

// Proses Tambah Buku Baru dari Form
app.post('/add-book', upload.single('image'), (req, res) => {
    const { title, author, price } = req.body;
    const newBook = {
        id: Date.now(),
        title: title,
        author: author,
        price: price,
        image: req.file ? `/uploads/${req.file.filename}` : "https://via.placeholder.com/150"
    };
    BOOKS.push(newBook);
    // Setelah tambah, balik lagi ke tampilan admin
    res.send("<script>alert('Buku Berhasil Ditambah!'); window.location='/jestri-control';</script>");
});

// Proses Hapus Buku
app.get('/delete-book/:id', (req, res) => {
    const bookId = req.params.id;
    BOOKS = BOOKS.filter(book => book.id != bookId);
    res.send("<script>alert('Buku Dihapus!'); window.location='/jestri-control';</script>");
});

// --- 3. HALAMAN WATERMARK LAB ---
app.get('/jestri-lab', (req, res) => {
    res.render('lab');
});

// Export untuk Vercel
module.exports = app;

// Jalankan server jika di lokal
if (require.main === module) {
    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
}

