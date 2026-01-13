const express = require('express');
const session = require('express-session');
const app = express();

// --- PENGATURAN SESSION (Sangat Penting) ---
app.use(session({
    secret: 'kunci-rahasia-jestri', // Gunakan string bebas
    resave: false,
    saveUninitialized: false, // Set ke false agar session tidak dibuat sembarangan
    cookie: { 
        maxAge: 3600000, // Session aktif selama 1 jam
        secure: false    // Set ke true hanya jika menggunakan HTTPS
    }
}));

app.use(express.urlencoded({ extended: true }));

// --- MIDDLEWARE CEK LOGIN ---
function checkAdmin(req, res, next) {
    if (req.session.isAdmin) {
        return next();
    }
    res.redirect('/login'); // Jika tidak ada session, lempar ke login
}

// --- ROUTE TAMBAH BUKU ---
app.post('/tambah-buku', checkAdmin, (req, res) => {
    const { judul, harga } = req.body;
    
    // Anggap ini proses database Anda
    // db.query("INSERT INTO buku...", [judul, harga], (err) => {
    
    // SETELAH BERHASIL: Jangan redirect ke login!
    // Arahkan kembali ke halaman dashboard admin
    res.redirect('/admin-dashboard'); 
    
    // });
});

// --- ROUTE HAPUS BUKU ---
app.get('/hapus-buku/:id', checkAdmin, (req, res) => {
    const id = req.params.id;
    
    // db.query("DELETE FROM buku WHERE id=...", [id], (err) => {
    
    // Arahkan kembali ke halaman dashboard admin
    res.redirect('/admin-dashboard');
    
    // });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

