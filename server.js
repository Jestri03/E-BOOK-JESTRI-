const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PDFDocument, rgb, degrees } = require('pdf-lib'); // Library Watermark

const app = express();
const PORT = process.env.PORT || 3000;

// Path Database & Log Keamanan
const booksPath = path.join('/tmp', 'books.json');
const securityLogPath = path.join('/tmp', 'security_audit.log');
if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));
if (!fs.existsSync(securityLogPath)) fs.writeFileSync(securityLogPath, '--- LOG KEAMANAN JESTRI ---\n');

// --- SISTEM PERTAHANAN LEVEL TINGGI ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Anti-Brute Force (Maksimal 5 kali salah)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (req, res) => {
        const logMsg = `[${new Date().toLocaleString()}] SERANGAN DETEKSI IP: ${req.ip}\n`;
        fs.appendFileSync(securityLogPath, logMsg);
        res.status(429).send('<script>alert("SISTEM MENGUNCI AKSES ANDA!"); window.location="/";</script>');
    }
});

app.use(session({
    name: 'jestri_secure_core',
    secret: 'JESTRI-SUPER-X-CORE-ENCRYPT-99',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'strict', maxAge: 3600000 }
}));

const upload = multer({ dest: '/tmp/' });
app.use('/uploads', express.static('/tmp'));

// Middleware Kunci Admin (Manusia 100%)
const secureAdmin = (req, res, next) => {
    if (req.session.isAdmin && req.session.fingerprint === req.headers['user-agent']) {
        return next();
    }
    res.redirect('/login-admin');
};

// --- FUNGSI WATERMARK OTOMATIS ---
async function prosesWatermark(inputPath, originalName) {
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText('E-BOOK JESTRI', {
            x: width / 5,
            y: height / 2.5,
            size: 60,
            color: rgb(0.8, 0.8, 0.8),
            opacity: 0.3,
            rotate: degrees(45),
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
        let books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        const { genre, search } = req.query;
        if (genre && genre !== 'Semua Buku') books = books.filter(b => b.genre === genre);
        if (search) books = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
        res.render('index', { books });
    } catch (e) { res.render('index', { books: [] }); }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', loginLimiter, (req, res) => {
    if (req.body.password === 'JESTRI0301209') { // Password Baru
        req.session.isAdmin = true;
        req.session.fingerprint = req.headers['user-agent'];
        return res.redirect('/admin-dashboard');
    }
    fs.appendFileSync(securityLogPath, `[WARN] Salah Password pada ${new Date().toLocaleString()}\n`);
    res.status(401).send('<script>alert("AKSES DITOLAK!"); window.location="/login-admin";</script>');
});

app.get('/admin-dashboard', secureAdmin, (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    res.render('admin', { mode: 'dashboard', books });
});

// Fitur Download PDF Ber-watermark
app.post('/secure-pdf', secureAdmin, upload.single('pdfFile'), async (req, res) => {
    if (!req.file) return res.send("File PDF belum dipilih!");
    try {
        const securedPath = await prosesWatermark(req.file.path, req.file.originalname);
        res.download(securedPath);
    } catch (err) { res.send("Gagal memproses PDF."); }
});

// Log Keamanan Rahasia
app.get('/cek-keamanan-jestri', secureAdmin, (req, res) => {
    const logs = fs.readFileSync(securityLogPath, 'utf8');
    res.send(`<pre>AUDIT LOG KEAMANAN:\n\n${logs}</pre>`);
});

app.post('/add-book', secureAdmin, upload.single('image'), (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        books.push({
            id: Date.now(),
            title: req.body.title,
            genre: req.body.genre,
            price: req.body.price,
            description: req.body.description || 'Admin',
            image: req.file ? req.file.filename : ''
        });
        fs.writeFileSync(booksPath, JSON.stringify(books));
        res.redirect('/admin-dashboard');
    } catch (err) { res.redirect('/admin-dashboard'); }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log('🛡️ Website Secured by Jestri Core'));
module.exports = app;

