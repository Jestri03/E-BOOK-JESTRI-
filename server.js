onst express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

// DATA CADANGAN AGAR TIDAK INTERNAL SERVER ERROR
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
    // Cek apakah file index ada, jika tidak, kirim pesan simpel agar tidak error 500
    if (!fs.existsSync(path.join(__dirname, 'views', 'index.ejs'))) {
        return res.send("<h1>Website JESTRI Sedang Loading...</h1><p>Tunggu 1 menit lalu refresh.</p>");
    }
    res.render('index', { books: BUKU_DATA });
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'menu-selection' });
    } else {
        res.send('<script>alert("Salah!"); window.location="/login-admin";</script>');
    }
});

app.get('/admin/katalog', (req, res) => res.render('admin', { mode: 'katalog', books: BUKU_DATA }));
app.get('/admin/watermark-lab', (req, res) => res.render('admin', { mode: 'watermark-lab' }));

app.post('/process-watermark', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) return res.send("Pilih file PDF!");
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        pdfDoc.getPages()[0].drawText('E-BOOK JESTRI SECURED', { x: 50, y: 50, size: 30, opacity: 0.5 });
        const pdfBytes = await pdfDoc.save();
        const out = path.join('/tmp', 'SECURED_' + req.file.originalname);
        fs.writeFileSync(out, pdfBytes);
        res.download(out);
    } catch (err) { res.status(500).send("Gagal: " + err.message); }
});

app.listen(PORT, () => console.log('Server Ready'));
module.exports = app;

