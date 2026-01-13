const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Data Katalog Tetap
const BUKU_DATA = [{
    id: "1",
    title: "The Psychology of Money",
    genre: "Finansial",
    price: "2.800",
    description: "Penulis: Morgan Housel",
    image: "https://i.ibb.co/LzNfXf0/1000715150.jpg"
}];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: '/tmp/' });

// --- ROUTES ---
app.get('/', (req, res) => {
    res.render('index', { books: BUKU_DATA });
});

app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login' });
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'menu-selection' });
    } else {
        res.send('<script>alert("Salah!"); window.location="/login-admin";</script>');
    }
});

app.get('/admin/katalog', (req, res) => {
    res.render('admin', { mode: 'katalog', books: BUKU_DATA });
});

app.get('/admin/watermark-lab', (req, res) => {
    res.render('admin', { mode: 'watermark-lab' });
});

app.post('/process-watermark', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) return res.send("File PDF belum dipilih!");
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        const pages = pdfDoc.getPages();
        pages[0].drawText('E-BOOK JESTRI SECURED', { x: 50, y: 50, size: 30, opacity: 0.5 });
        const pdfBytes = await pdfDoc.save();
        const outPath = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(outPath, pdfBytes);
        res.download(outPath);
    } catch (err) {
        res.status(500).send("Gagal proses PDF");
    }
});

app.get('/logout', (req, res) => res.redirect('/'));

app.listen(PORT, () => console.log('Ready'));
module.exports = app;

