const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Database & Log Security Path
const booksPath = path.join('/tmp', 'books.json');
const securityLogPath = path.join('/tmp', 'security_audit.log'); // Mencatat percobaan retas

if (!fs.existsSync(booksPath)) fs.writeFileSync(booksPath, JSON.stringify([]));
if (!fs.existsSync(securityLogPath)) fs.writeFileSync(securityLogPath, '--- LOG KEAMANAN JESTRI ---\n');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 🛡️ ANTI-BRUTE FORCE: Blokir Hacker setelah 5 kali salah
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (req, res) => {
        const logMsg = `[${new Date().toLocaleString()}] PERCOBAAN PERETASAN dari IP: ${req.ip}\n`;
        fs.appendFileSync(securityLogPath, logMsg);
        res.status(429).send('<script>alert("SISTEM MENDETEKSI SERANGAN! Akses Anda diblokir 15 menit."); window.location="/";</script>');
    }
});

app.use(session({
    name: 'jestri_secure_core',
    secret: 'X-CORE-JESTRI-SUPER-ENCRYPT-999',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'strict', maxAge: 3600000 }
}));

const upload = multer({ dest: '/tmp/', limits: { fileSize: 2 * 1024 * 1024 } });

// Kunci Keamanan Akses Admin
const secureAdmin = (req, res, next) => {
    if (req.session.isAdmin && req.session.fingerprint === req.headers['user-agent']) {
        return next();
    }
    res.redirect('/login-admin');
};

// --- ROUTES ---

app.get('/', (req, res) => {
    try {
        const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
        res.render('index', { books });
    } catch (e) { res.render('index', { books: [] }); }
});

app.get('/login-admin', (req, res) => res.render('admin', { mode: 'login' }));

app.post('/login-admin', loginLimiter, (req, res) => {
    const { password } = req.body;
    
    // PASSWORD: JESTRI0301209
    if (password === 'JESTRI0301209') {
        req.session.isAdmin = true;
        req.session.fingerprint = req.headers['user-agent'];
        return res.redirect('/admin-dashboard');
    }

    // Catat ke log jika password salah (Indikasi Hacker)
    const alertMsg = `[WARN] Salah Password pada ${new Date().toLocaleString()} dari ${req.headers['user-agent']}\n`;
    fs.appendFileSync(securityLogPath, alertMsg);
    
    res.status(401).send('<script>alert("PASSWORD SALAH!"); window.location="/login-admin";</script>');
});

app.get('/admin-dashboard', secureAdmin, (req, res) => {
    const books = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    // Tambahkan log keamanan ke tampilan admin agar kamu bisa pantau
    res.render('admin', { mode: 'dashboard', books });
});

// Fitur Cek Log Keamanan (Hanya Admin yang bisa buka lewat URL rahasia ini)
app.get('/cek-keamanan-jestri', secureAdmin, (req, res) => {
    const logs = fs.readFileSync(securityLogPath, 'utf8');
    res.send(`<pre>DATA PERCOBAAN RETAS:\n\n${logs}</pre>`);
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

app.listen(PORT, () => console.log('🛡️ Website Dilindungi Sistem Anti-Hacker'));
module.exports = app;

