const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// Koneksi dengan proteksi timeout (biar gak stuck hitam)
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 3000 // Maksimal nunggu DB 3 detik
}).catch(err => console.log("Koneksi DB Error, tapi layout pembeli harus tetep muncul."));

const Buku = mongoose.model('Buku', { judul: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-mewah'], maxAge: 24 * 60 * 60 * 1000 }));

// TAMPILAN MEWAH (MODERN DARK GOLD) - Fokus Mode Pembeli
const layoutPembeli = (isiKonten) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JESTRI E-BOOK STORE</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
        body { font-family: 'Poppins', sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
        .nav { background: #111; padding: 20px; text-align: center; border-bottom: 3px solid #f39c12; position: sticky; top: 0; z-index: 100; }
        .nav h1 { color: #f39c12; margin: 0; letter-spacing: 5px; font-size: 1.8em; text-transform: uppercase; }
        
        .container { max-width: 1200px; margin: auto; padding: 40px 20px; }
        
        /* Grid Barang Pembeli */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
        
        .card { background: #161616; border-radius: 20px; overflow: hidden; border: 1px solid #333; transition: 0.4s ease; position: relative; }
        .card:hover { transform: translateY(-10px); border-color: #f39c12; box-shadow: 0 10px 30px rgba(243, 156, 18, 0.2); }
        
        .card img { width: 100%; height: 380px; object-fit: cover; background: #222; }
        
        .info { padding: 20px; text-align: center; }
        .info h3 { margin: 10px 0; font-size: 1.3em; color: #f39c12; }
        .price { display: block; font-size: 1.5em; color: #2ecc71; font-weight: bold; margin-bottom: 20px; }
        
        .btn-wa { display: block; background: #f39c12; color: white; text-decoration: none; padding: 15px; border-radius: 12px; font-weight: bold; transition: 0.3s; }
        .btn-wa:hover { background: #e67e22; box-shadow: 0 5px 15px rgba(230, 126, 34, 0.4); }
        
        .empty-state { text-align: center; padding: 100px 20px; }
        .empty-state h2 { color: #555; }
    </style>
</head>
<body>
    <div class="nav"><h1>JESTRI STORE</h1></div>
    <div class="container">${isiKonten}</div>
</body>
</html>`;

// --- ROUTE UTAMA (MODE PEMBELI) ---
app.get('/', async (req, res) => {
    try {
        // Ambil data tapi jangan kelamaan nunggu
        const data = await Buku.find().lean().exec();

        // Cek kalau data ada
        if (data && data.length > 0) {
            const cards = data.map(b => `
                <div class="card">
                    <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=Cover+Buku'">
                    <div class="info">
                        <h3>${b.judul}</h3>
                        <span class="price">Rp ${Number(b.harga).toLocaleString('id-ID')}</span>
                        <a href="https://wa.me/628123456789?text=Halo%20Admin,%20saya%20mau%20order%20${b.judul}" class="btn-wa">🛒 PESAN SEKARANG</a>
                    </div>
                </div>
            `).join('');
            res.send(layoutPembeli(`<div class="grid">${cards}</div>`));
        } else {
            // Tampilan kalau dagangan masih kosong (biar gak item polos)
            res.send(layoutPembeli(`
                <div class="empty-state">
                    <h2>KATALOG BELUM TERSEDIA</h2>
                    <p>Mohon maaf, saat ini belum ada buku yang diupload.</p>
                </div>
            `));
        }
    } catch (err) {
        // Jika DB Error/Timeout, tetep munculin layout pembeli dengan pesan error
        res.send(layoutPembeli(`
            <div class="empty-state">
                <h2 style="color:red;">GAGAL MEMUAT DATA</h2>
                <p>Cek koneksi internet atau database lo, Bro. Tapi layout udah bener kan?</p>
            </div>
        `));
    }
});

// ROUTE ADMIN (Tetap ada buat fungsi login tapi gue minimalisir kodenya)
app.get('/login', (req, res) => { res.send(`<html><body style="background:#0a0a0a;color:white;text-align:center;padding:100px;"><form action="/admin-dashboard" method="POST"><h2>ADMIN</h2><input type="password" name="password"><button>LOGIN</button></form></body></html>`); });
app.post('/admin-dashboard', (req, res) => { if(req.body.password==='JESTRI0301209'){req.session.admin=true;res.redirect('/jestri-control');}else{res.send("Salah");} });
app.get('/jestri-control', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const data = await Buku.find().lean();
    const rows = data.map(b => `<li>${b.judul} - <a href="/hapus-buku/${b._id}">Hapus</a></li>`).join('');
    res.send(`<body style="background:#111;color:white;padding:50px;"><h2>Panel Admin</h2><form action="/tambah-buku" method="POST"><input name="judul" placeholder="Judul"><input name="harga" placeholder="Harga"><input name="gambar" placeholder="Link Gambar"><button>Simpan</button></form><ul>${rows}</ul><a href="/">Balik ke Toko</a></body>`);
});
app.post('/tambah-buku', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/jestri-control'); });
app.get('/hapus-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/jestri-control'); });

module.exports = app;

