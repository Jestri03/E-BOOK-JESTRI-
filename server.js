const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// DATA BUKU PERMANEN (Mencegah Internal Server Error)
const BUKU_TETAP = [
    {
        id: "static-1",
        title: "The Psychology of Money",
        genre: "Finansial",
        price: "2.800",
        description: "Penulis: Morgan Housel",
        image: "https://i.ibb.co/LzNfXf0/1000715150.jpg" 
    }
];

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({ dest: '/tmp/' });

// ROUTE UTAMA
app.get('/', (req, res) => {
    // Selalu tampilkan buku tetap agar tidak error
    res.render('index', { books: BUKU_TETAP });
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

// LOGIN TANPA SESSION (Agar tidak Forbidden di Vercel)
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'dashboard', books: BUKU_TETAP });
    } else {
        res.send('<script>alert("Salah!"); window.location="/login-admin";</script>');
    }
});

// WATERMARK LAB (Optimasi Anti-Forbidden)
app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("File PDF belum dipilih!");
    try {
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        const pages = pdfDoc.getPages();
        pages[0].drawText('E-BOOK JESTRI', { x: 50, y: 50, size: 30, opacity: 0.4 });
        
        const pdfBytes = await pdfDoc.save();
        const outPath = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(outPath, pdfBytes);
        res.download(outPath);
    } catch (err) {
        res.status(500).send("Gagal memproses PDF. Pastikan file tidak diproteksi.");
    }
});

app.listen(PORT, () => console.log('Server Ready'));
module.exports = app;

