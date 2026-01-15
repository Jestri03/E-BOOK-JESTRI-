const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const app = express();

// --- KONFIGURASI CLOUDINARY (AMANKAN PENYIMPANAN PDF) ---
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

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(cookieSession({ name: 'jestri_v6', keys: ['JESTRI_FINAL_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API DATA ---
app.get('/api/buku-json', async (req, res) => {
    const data = await Buku.find().sort({_id:-1}).lean();
    res.json(data);
});

// --- UI ADMIN (DARK PREMIUM & ANTI-GOYANG) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 20px; overflow-x: hidden; }
        .wrapper { max-width: 500px; margin: auto; }
        .glass-card { background: #161e2d; padding: 25px; border-radius: 24px; border: 1px solid #2d3748; margin-bottom: 20px; }
        h2, h3 { color: #60a5fa; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; }
        .inp-group { margin-bottom: 15px; }
        label { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 6px; font-weight: 600; }
        input, select { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #2d3748; background: #0b0f19; color: #fff; font-size: 16px; outline: none; transition: 0.3s; }
        input:focus { border-color: #60a5fa; }
        .btn-main { width: 100%; padding: 16px; border-radius: 14px; border: none; background: #3b82f6; color: #fff; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(59,130,246,0.3); }
        .list-item { background: #1e293b; padding: 15px; border-radius: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #334155; }
        .btn-approve { background: #10b981; color: #fff; padding: 8px 15px; border-radius: 8px; text-decoration: none; font-size: 0.75rem; font-weight: 700; }
        .btn-del { color: #ef4444; text-decoration: none; font-size: 0.8rem; }
    </style></head><body>
    <div class="wrapper">
        <h2><i class="fa-solid fa-crown"></i> JESTRI PANEL</h2>
        
        <div class="glass-card">
            <h3><i class="fa-solid fa-cloud-arrow-up"></i> Tambah Buku</h3>
            <form action="/admin/add" method="POST" enctype="multipart/form-data" id="uploadForm">
                <div class="inp-group"><label>1. JUDUL BUKU</label><input name="judul" required></div>
                <div class="inp-group"><label>2. NAMA PENULIS</label><input name="penulis" required></div>
                <div class="inp-group"><label>3. HARGA (Contoh: 2.500)</label><input name="harga" required></div>
                <div class="inp-group"><label>4. GAMBAR (PILIH GALERI)</label><input type="file" name="gambar" accept="image/*" required></div>
                <div class="inp-group"><label>5. FILE PDF (PILIH FILE HP)</label><input type="file" name="pdf" accept=".pdf" required></div>
                <div class="inp-group"><label>GENRE</label><select name="genre">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select></div>
                <button type="submit" class="btn-main" id="btnS">UPLOAD & SIMPAN</button>
            </form>
        </div>

        <h3><i class="fa-solid fa-bell"></i> Persetujuan TF</h3>
        ${o.map(x => `<div class="list-item">
            <div><div style="font-size:0.9rem; font-weight:700;">${x.judulBuku}</div><a href="${x.bukti}" target="_blank" style="color:#60a5fa; font-size:0.7rem;">Lihat Bukti Foto</a></div>
            <a href="/admin/approve/${x._id}" class="btn-approve">SETUJUI</a>
        </div>`).join('')}

        <h3 style="margin-top:30px;"><i class="fa-solid fa-book-open"></i> Katalog</h3>
        ${b.map(x => `<div class="list-item">
            <span style="font-size:0.85rem;">${x.judul}</span>
            <a href="/admin/del/${x._id}" class="btn-del" onclick="return confirm('Hapus buku ini?')"><i class="fa-solid fa-trash"></i></a>
        </div>`).join('')}
    </div>
    <script>
        document.getElementById('uploadForm').onsubmit = function() {
            const b = document.getElementById('btnS');
            b.innerText = 'PROSES UPLOAD (MOHON TUNGGU)...';
            b.style.background = '#6b7280';
            b.disabled = true;
        };
    </script>
    </body></html>`);
});

// --- PROSES UPLOAD AMAN & PERMANEN ---
app.post('/admin/add', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    try {
        // Upload Gambar
        const upGambar = await cloudinary.uploader.upload(req.files.gambar.tempFilePath, { folder: 'covers' });
        // Upload PDF (Resource_type raw agar aman untuk file PDF)
        const upPdf = await cloudinary.uploader.upload(req.files.pdf.tempFilePath, { folder: 'files', resource_type: 'raw' });
        
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
        res.status(500).send("Upload Gagal: " + err.message);
    }
});

// --- PERSYARATAN LAINNYA ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
    body{background:#0b0f19; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif;}
    .login{background:#161e2d; padding:40px; border-radius:30px; border:1px solid #2d3748; text-align:center; width:90%; max-width:340px;}
    input{width:100%; padding:15px; margin:20px 0; border-radius:15px; border:1px solid #2d3748; background:#0b0f19; color:#fff; font-size:18px; text-align:center;}
    button{width:100%; padding:16px; border-radius:15px; border:none; background:#3b82f6; color:#fff; font-weight:800;}
    </style></head><body><div class="login"><h2 style="color:#fff;">Admin Login</h2><form action="/login" method="POST"><input name="pw" type="password" placeholder="***" required><button>MASUK</button></form></div></body></html>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });
app.get('/admin/approve/:id', async (req, res) => {
    const o = await Order.findById(req.params.id);
    const b = await Buku.findById(o.bukuId);
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: b.pdfUrl });
    res.redirect('/admin');
});

// Jalankan Pembeli (Gunakan kode tampilan pembeli dari pesan sebelumnya)
app.get('/', (req, res) => { /* Tampilan pembeli tetap sama */ res.redirect('/api/buku-json'); });

app.listen(process.env.PORT || 3000);

