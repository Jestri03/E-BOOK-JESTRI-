const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// DATA TETAP - Agar TIDAK Internal Server Error lagi
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

app.get('/', (req, res) => {
    res.render('index', { books: BUKU_DATA });
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'dashboard', books: BUKU_DATA });
    } else {
        res.send('<script>alert("Salah!"); window.location="/login-admin";</script>');
    }
});

app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("File PDF kosong");
    try {
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        pdfDoc.getPages()[0].drawText('E-BOOK JESTRI', { x: 50, y: 50, size: 30, opacity: 0.5 });
        const pdfBytes = await pdfDoc.save();
        const out = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(out, pdfBytes);
        res.download(out);
    } catch (err) { res.status(500).send("Gagal proses PDF"); }
});

app.listen(PORT, () => console.log('Ready'));
module.exports = app;

