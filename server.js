const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2; // Library untuk simpan PDF permanen
const app = express();

// --- KONFIGURASI CLOUDINARY (Ganti dengan API Key lo jika sudah punya) ---
cloudinary.config({ 
  cloud_name: 'dxtp7vsqy', 
  api_key: '878233377218398', 
  api_secret: 'T4n9_jLp7B6hC-j-y-3l6H_O8mU' 
});

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI);

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, pdfUrl: String, genre: String 
});

const Order = mongoose.model('Order', { 
    bukuId: String, judulBuku: String, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String 
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload({ useTempFiles: true })); // Penting untuk upload file besar
app.use(cookieSession({ name: 'jestri_admin', keys: ['SECRET_KEY_PRO'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API DATA ---
app.get('/api/buku-json', async (req, res) => {
    const data = await Buku.find().sort({_id:-1}).lean();
    res.json(data);
});

// --- DASHBOARD ADMIN (TAMPILAN PREMIUM & STABIL) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: auto; overflow: hidden; }
        .card { background: #1e293b; padding: 25px; border-radius: 20px; border: 1px solid #334155; margin-bottom: 25px; }
        h2, h3 { color: #38bdf8; margin-top: 0; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-size: 0.8rem; margin-bottom: 5px; color: #94a3b8; }
        input, select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #334155; background: #0f172a; color: #fff; box-sizing: border-box; font-size: 16px; }
        button { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #38bdf8; color: #000; font-weight: 800; cursor: pointer; transition: 0.3s; }
        button:active { transform: scale(0.98); }
        .item-list { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #38bdf8; }
        .btn-del { color: #f87171; text-decoration: none; font-size: 0.8rem; font-weight: bold; }
        .badge { background: #fbbf24; color: #000; padding: 2px 8px; border-radius: 5px; font-size: 0.7rem; font-weight: bold; }
    </style></head><body>
    <div class="container">
        <h2><i class="fa-solid fa-user-shield"></i> JESTRI ADMIN</h2>
        
        <div class="card">
            <h3><i class="fa-solid fa-plus-circle"></i> Tambah Buku</h3>
            <form action="/admin/add" method="POST" enctype="multipart/form-data">
                <div class="form-group"><label>1. Judul Buku</label><input name="judul" required></div>
                <div class="form-group"><label>2. Nama Penulis</label><input name="penulis" required></div>
                <div class="form-group"><label>3. Harga Buku</label><input name="harga" placeholder="Contoh: 2.500" required></div>
                <div class="form-group"><label>4. Gambar Buku (Galeri)</label><input type="file" name="gambar" accept="image/*" required></div>
                <div class="form-group"><label>5. File PDF E-Book (Permanen)</label><input type="file" name="pdf" accept=".pdf" required></div>
                <div class="form-group"><label>Pilih Genre</label><select name="genre">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select></div>
                <button type="submit">UPLOAD & SIMPAN</button>
            </form>
        </div>

        <h3><i class="fa-solid fa-clock"></i> Persetujuan TF (${o.length})</h3>
        ${o.map(x => `<div class="item-list">
            <div><b>${x.judulBuku}</b><br><a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.75rem;">Cek Bukti Transfer</a></div>
            <a href="/admin/approve/${x._id}" style="background:#2ecc71; color:#fff; padding:8px 12px; border-radius:8px; text-decoration:none; font-size:0.7rem; font-weight:bold;">SETUJUI</a>
        </div>`).join('')}

        <h3 style="margin-top:30px;"><i class="fa-solid fa-book"></i> Katalog</h3>
        ${b.map(x => `<div class="item-list">
            <span>${x.judul}</span>
            <a href="/admin/del/${x._id}" class="btn-del" onclick="return confirm('Hapus buku ini?')">HAPUS</a>
        </div>`).join('')}
        
        <a href="/logout" style="display:block; text-align:center; color:#94a3b8; margin-top:20px; text-decoration:none;">Keluar Dashboard</a>
    </div>
    </body></html>`);
});

// --- PROSES UPLOAD KE CLOUDINARY (PERMANEN) ---
app.post('/admin/add', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    try {
        // Upload Gambar
        const upGambar = await cloudinary.uploader.upload(req.files.gambar.tempFilePath, { folder: 'jestri_ebook/covers' });
        // Upload PDF (Permanen & Aman)
        const upPdf = await cloudinary.uploader.upload(req.files.pdf.tempFilePath, { folder: 'jestri_ebook/files', resource_type: 'raw' });
        
        const cleanHarga = Number(req.body.harga.replace(/[^0-9]/g, ''));
        await new Buku({
            judul: req.body.judul,
            penulis: req.body.penulis,
            harga: cleanHarga,
            genre: req.body.genre,
            gambar: upGambar.secure_url,
            pdfUrl: upPdf.secure_url
        }).save();
        
        res.redirect('/admin');
    } catch (err) {
        res.send("Gagal upload file. Pastikan file tidak terlalu besar. Detail: " + err.message);
    }
});

// --- LOGIN PAGE (PREMIUM DARK) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
        body { background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; }
        .login-box { background:#1e293b; padding:40px; border-radius:25px; box-shadow:0 10px 25px rgba(0,0,0,0.3); text-align:center; width:85%; max-width:320px; border:1px solid #334155; }
        input { width:100%; padding:15px; margin:20px 0; border-radius:12px; border:1px solid #334155; background:#0f172a; color:#fff; text-align:center; box-sizing:border-box; font-size:18px; }
        button { width:100%; padding:15px; border-radius:12px; border:none; background:#38bdf8; color:#000; font-weight:800; font-size:16px; }
    </style></head><body>
    <div class="login-box">
        <h2 style="color:#fff; margin:0;">Admin Access</h2>
        <form action="/login" method="POST">
            <input name="pw" type="password" placeholder="Password" autofocus required>
            <button>MASUK KE PANEL</button>
        </form>
    </div></body></html>`);
});

// --- LOGIKA LAINNYA ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.get('/logout', (req, res) => { req.session = null; res.redirect('/login'); });

app.get('/admin/approve/:id', async (req, res) => {
    const order = await Order.findById(req.params.id);
    const buku = await Buku.findById(order.bukuId);
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: buku.pdfUrl });
    res.redirect('/admin');
});

app.get('/admin/del/:id', async (req, res) => {
    if(req.session.admin) await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});

// Jalur Pembeli tetap seperti kode sebelumnya (sudah optimal)
// [Kode Tampilan Utama sama seperti sebelumnya, gue fokus perbaiki Admin lo]
app.listen(process.env.PORT || 3000);

