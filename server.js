const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Data Buku (Tampilan tetap sama seperti yang kamu mau)
const BUKU_DATA = [{
    id: "1",
    title: "The Psychology of Money",
    genre: "Finansial",
    price: "2.800",
    description: "Penulis: Morgan Housel",
    image: "https://i.ibb.co/LzNfXf0/1000715150.jpg"
}];

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: '/tmp/' });

// Halaman Depan Pembeli (Tampilan tetap sama)
app.get('/', (req, res) => {
    res.render('index', { books: BUKU_DATA });
});

// Sistem Login Admin
app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

// Dashboard Pilihan (Katalog & Watermark Terpisah)
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'menu-selection' });
    } else {
        res.send('<script>alert("Salah!"); window.location="/login-admin";</script>');
    }
});

// Route Katalog
app.get('/admin/katalog', (req, res) => {
    res.render('admin', { mode: 'katalog', books: BUKU_DATA });
});

// Route Watermark (Dashboard Berbeda sesuai saran kamu)
app.get('/admin/watermark-lab', (req, res) => {
    res.render('admin', { mode: 'watermark-lab' });
});

app.post('/process-watermark', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("File PDF belum dipilih!");
    try {
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        pdfDoc.getPages()[0].drawText('E-BOOK JESTRI SECURED', { x: 50, y: 50, size: 30, opacity: 0.4 });
        const pdfBytes = await pdfDoc.save();
        const outPath = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(outPath, pdfBytes);
        res.download(outPath);
    } catch (err) { res.status(500).send("Gagal proses PDF"); }
});

app.listen(PORT, () => console.log('Ready'));
module.exports = app;

