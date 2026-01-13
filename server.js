const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const compression = require('compression');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Buku Tetap agar Tidak Internal Server Error
const BUKU_DATA = [
    {
        id: "1",
        title: "The Psychology of Money",
        genre: "Finansial",
        price: "2.800",
        description: "Penulis: Morgan Housel",
        image: "https://i.ibb.co/LzNfXf0/1000715150.jpg"
    }
];

app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());

const upload = multer({ dest: '/tmp/' });

// --- ROUTES ---

// 1. Halaman Pembeli (Fix Internal Server Error)
app.get('/', (req, res) => {
    res.render('index', { books: BUKU_DATA });
});

// 2. Halaman Login
app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login' });
});

// 3. Proses Login Langsung (Fix Forbidden)
// Kita tidak pakai session dulu supaya Vercel tidak memblokir
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'dashboard', books: BUKU_DATA });
    } else {
        res.send('<script>alert("Password Salah!"); window.location="/login-admin";</script>');
    }
});

// 4. Fitur Watermark Lab (Fix Forbidden)
app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("File tidak ditemukan!");
    try {
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        const pages = pdfDoc.getPages();
        pages.forEach((page) => {
            page.drawText('E-BOOK JESTRI', {
                x: 50, y: 50, size: 50,
                color: rgb(0.8, 0.8, 0.8), opacity: 0.3, rotate: degrees(45),
            });
        });
        const pdfBytes = await pdfDoc.save();
        const outputPath = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(outputPath, pdfBytes);
        res.download(outputPath);
    } catch (err) {
        res.status(500).send("Gagal memproses PDF: " + err.message);
    }
});

app.get('/logout', (req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => console.log('Server Aktif di Port ' + PORT));
module.exports = app;

