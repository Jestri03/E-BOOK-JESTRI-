onst express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: '/tmp/' });

// DATA BUKU
const BOOKS = [{ id: "1", title: "The Psychology of Money", price: "2.800", image: "https://i.ibb.co/LzNfXf0/1000715150.jpg" }];

app.get('/', (req, res) => res.render('index', { books: BOOKS }));
app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') {
        res.render('admin', { mode: 'menu-selection' });
    } else {
        res.send("Password Salah!");
    }
});

app.get('/admin/katalog', (req, res) => res.render('admin', { mode: 'katalog', books: BOOKS }));
app.get('/admin/watermark-lab', (req, res) => res.render('admin', { mode: 'watermark-lab' }));

app.post('/process-watermark', upload.single('pdfFile'), async (req, res) => {
    try {
        const bytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(bytes);
        pdfDoc.getPages()[0].drawText('JESTRI SECURED', { x: 50, y: 50, size: 30 });
        const pdfBytes = await pdfDoc.save();
        res.contentType("application/pdf");
        res.send(Buffer.from(pdfBytes));
    } catch (e) { res.send("Gagal proses PDF"); }
});

app.listen(PORT, () => console.log('Ready'));
module.exports = app;

