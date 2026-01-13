const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const compression = require('compression');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// Database sementara untuk Vercel
const booksPath = path.join('/tmp', 'books.json');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));

app.use(compression());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({ dest: '/tmp/' });

// --- FUNGSI WATERMARK ---
async function prosesWatermark(inputPath, originalName) {
    const bytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText('E-BOOK JESTRI', {
            x: width / 5, y: height / 2.5, size: 50,
            color: rgb(0.8, 0.8, 0.8), opacity: 0.3, rotate: degrees(45),
        });
    });
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join('/tmp', 'SECURED_' + originalName);
    fs.writeFileSync(outputPath, pdfBytes);
    return outputPath;
}

// --- ROUTES ---

app.get('/', (req, res) => {
    try {
        const data = fs.readFileSync(booksPath, 'utf8');
        res.render('index', { books: JSON.parse(data) });
    } catch (e) { res.render('index', { books: [] }); }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

// Login langsung tanpa session ribet agar tidak "Forbidden"
app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        return res.render('admin', { mode: 'dashboard', books });
    }
    res.send('<script>alert("Salah!"); window.location="/login-admin";</script>');
});

// Fitur Watermark Lab (Langsung Download)
app.post('/secure-pdf', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("File tidak ditemukan!");
    try {
        const securedPath = await prosesWatermark(req.file.path, req.file.originalname);
        res.download(securedPath);
    } catch (err) { res.send("Gagal proses PDF."); }
});

app.post('/add-book', upload.single('image'), (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        books.push({
            id: Date.now(), title: req.body.title, genre: req.body.genre,
            price: req.body.price, description: req.body.description || 'Admin',
            image: req.file ? req.file.filename : ''
        });
        fs.writeFileSync(booksPath, JSON.stringify(books));
        res.render('admin', { mode: 'dashboard', books });
    } catch (err) { res.redirect('/login-admin'); }
});

app.get('/logout', (req, res) => res.redirect('/'));

app.listen(PORT, () => console.log('Sistem Aktif'));
module.exports = app;

