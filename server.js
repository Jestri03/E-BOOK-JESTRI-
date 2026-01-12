const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000; // Penting untuk peluncuran

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

let books = [];
if (fs.existsSync('books.json')) {
    books = JSON.parse(fs.readFileSync('books.json'));
}

// HALAMAN UTAMA (PEMBELI)
app.get('/', (req, res) => {
    res.render('index', { books: books });
});

// HALAMAN LOGIN ADMIN
app.get('/login-admin', (req, res) => {
    res.send(`
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; background:#f4f7f6;">
            <form action="/login-admin" method="POST" style="background:white; padding:30px; border-radius:15px; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
                <h2 style="text-align:center; color:#007AFF;">Login Admin</h2>
                <input type="password" name="password" placeholder="Masukkan Password" style="width:100%; padding:10px; margin:10px 0; border:1px solid #ddd; border-radius:8px;">
                <button type="submit" style="width:100%; padding:10px; background:#007AFF; color:white; border:none; border-radius:8px; cursor:pointer;">MASUK</button>
            </form>
        </body>
    `);
});

// PROSES LOGIN (Ganti 'jestri123' dengan password keinginanmu)
app.post('/login-admin', (req, res) => {
    const { password } = req.body;
    if (password === 'jestri123') { // PASSWORD KAMU
        res.redirect('/kelola-jestri');
    } else {
        res.send("<script>alert('Password Salah!'); window.location='/login-admin';</script>");
    }
});

// HALAMAN ADMIN (TERPROTEKSI)
app.get('/kelola-jestri', (req, res) => {
    res.render('admin', { books: books });
});

app.post('/add-book', upload.single('img'), (req, res) => {
    const { title, author, price, genre } = req.body;
    const newBook = { title, author, price, genre, img: req.file.filename };
    books.push(newBook);
    fs.writeFileSync('books.json', JSON.stringify(books));
    res.redirect('/kelola-jestri');
});

app.post('/delete-book/:id', (req, res) => {
    books.splice(req.params.id, 1);
    fs.writeFileSync('books.json', JSON.stringify(books));
    res.redirect('/kelola-jestri');
});

app.listen(port, () => {
    console.log(`Website Mengudara di Port: ${port}`);
});

