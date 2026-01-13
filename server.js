const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// INI KUNCINYA: Data buku dimasukkan langsung ke kode agar tidak ERROR
const BUKU_DATA = [
    {
        id: "buku-1",
        title: "The Psychology of Money",
        genre: "Finansial",
        price: "2.800",
        description: "Penulis: Morgan Housel",
        image: "https://i.ibb.co/LzNfXf0/1000715150.jpg"
    }
];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({ dest: '/tmp/' });

// --- ROUTES ---

// Fix Internal Server Error: Halaman Pembeli
app.get('/', (req, res) => {
    res.render('index', { books: BUKU_DATA });
});

// Halaman Login
app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login' });
});

// Fix Forbidden: Login Admin Langsung
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'dashboard', books: BUKU_DATA });
    } else {
        res.send('<script>alert("Password Salah!"); window.location="/login-admin";</script>');
    }
});

// Fix Forbidden: Proses Watermark PDF
app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("Pilih file PDF dulu!");
    try {
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        const pages = pdfDoc.getPages();
        // Beri tanda di halaman pertama saja agar cepat & tidak timeout (Forbidden)
        pages[0].drawText('E-BOOK JESTRI', { x: 50, y: 50, size: 30, opacity: 0.5 });
        
        const pdfBytes = await pdfDoc.save();
        const outPath = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(outPath, pdfBytes);
        res.download(outPath);
    } catch (err) {
        res.status(500).send("Gagal: PDF mungkin terproteksi atau terlalu besar.");
    }
});

app.get('/logout', (req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => console.log('Ready'));
module.exports = app;

