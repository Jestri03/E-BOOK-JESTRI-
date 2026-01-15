const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).catch(err => console.log("DB Offline"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String, pdfUrl: String 
});

const Order = mongoose.model('Order', { 
    bukuId: String, judulBuku: String, bukti: String, status: { type: String, default: 'Pending' }
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_vFinal', keys: ['JESTRI_MASTER'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API DATA ---
app.get('/api/buku-json', async (req, res) => {
    const data = await Buku.find().sort({_id:-1}).lean();
    res.json(data);
});

// --- TAMPILAN PEMBELI (OPTIMIZED) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="no-referrer">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; }
        .header { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s; padding: 40px 25px; box-shadow: 20px 0 60px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; display: none; }
        .overlay.active { display: block; }
        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 8px; border-radius: 12px; border: none; background: #f8f8f8; text-align: left; font-weight: 700; cursor: pointer; }
        .g-item.active { background: #000; color: #fff; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px 15px 100px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 15px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
        
        /* Floating Icons */
        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 110; }
        .s-link { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .checkout-box { background: #fff; width: 100%; max-width: 350px; border-radius: 20px; padding: 25px; text-align: center; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight:800;">MENU</h2>
        <button class="g-item active" onclick="setG('Semua', this)">Semua Koleksi</button>
        <span style="font-size:0.7rem; color:#ccc; margin:20px 0 10px 5px; display:block; font-weight:800;">GENRE</span>
        ${LIST_GENRE.map(g => `<button class="g-item" onclick="setG('${g}', this)">${g}</button>`).join('')}
    </div>
    
    <div class="header"><i class="fa-solid fa-bars-staggered" onclick="tog()" style="cursor:pointer;"></i><b>E-BOOK JESTRI</b><i class="fa-solid fa-search"></i></div>
    
    <div class="grid" id="gt"></div>
    
    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="s-link" style="background:#25d366;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-link" style="background:#e4405f;"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal">
        <div class="checkout-box" id="cb">
            <h3 id="m-judul" style="margin:0;"></h3>
            <p id="m-harga" style="color:#2ecc71; font-weight:800;"></p>
            <p style="font-size:0.75rem; background:#fff9db; padding:10px; border-radius:10px;">Transfer ke: <b>0895327806441</b><br>(DANA/OVO/GoPay)</p>
            <input type="file" id="bukti" style="font-size:0.7rem; margin:15px 0; width:100%;">
            <button id="btn-p" onclick="kirim()" style="width:100%; padding:15px; background:#000; color:#fff; border:none; border-radius:12px; font-weight:800;">KIRIM BUKTI TF</button>
            <button onclick="document.getElementById('modal').style.display='none'" style="margin-top:10px; border:none; background:none; color:#999;">Batal</button>
        </div>
    </div>

    <script>
        let allBuku = []; let curG = 'Semua'; let selId = '';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const r = await fetch('/api/buku-json'); allBuku = await r.json(); render(); }
        function setG(g, el){ curG = g; document.querySelectorAll('.g-item').forEach(b=>b.classList.remove('active')); el.classList.add('active'); if(window.innerWidth < 768) tog(); render(); }
        
        function render(){
            const f = allBuku.filter(b => curG==='Semua' || b.genre===curG);
            const grid = document.getElementById('gt');
            if(f.length === 0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:100px 20px; color:#ccc; font-weight:600;">Buku genre \${curG} belum ada</div>\`; return; }
            grid.innerHTML = f.map(x => \`<div class="card">
                <img src="https://wsrv.nl/?url=\${x.gambar.replace(/^https?:\\/\\//,'')}&w=300" style="width:100%; aspect-ratio:3/4; object-fit:cover;">
                <div style="padding:10px;">
                    <h4 style="margin:0; font-size:0.75rem; height:2.4em; overflow:hidden;">\${x.judul}</h4>
                    <div style="color:#2ecc71; font-weight:800; font-size:0.85rem; margin-top:5px;">Rp \${x.harga.toLocaleString('id-ID')}</div>
                    <button onclick="openMod('\${x._id}','\${x.judul}','\${x.harga}')" style="width:100%; padding:10px; background:#000; color:#fff; border-radius:10px; border:none; margin-top:8px; font-weight:800; font-size:0.7rem;">BELI</button>
                </div>
            </div>\`).join('');
        }

        function openMod(id, j, h){ selId=id; document.getElementById('m-judul').innerText=j; document.getElementById('m-harga').innerText='Rp '+Number(h).toLocaleString('id-ID'); document.getElementById('modal').style.display='flex'; }

        async function kirim(){
            const f = document.getElementById('bukti').files[0]; if(!f) return alert('Pilih foto bukti transfer!');
            const btn = document.getElementById('btn-p'); btn.innerText='Mengirim...'; btn.disabled=true;
            const fd = new FormData(); fd.append('image', f);
            const rI = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
            const iD = await rI.json();
            await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bukuId:selId, bukti:iD.data.url}) });
            document.getElementById('cb').innerHTML = \`<i class="fa-solid fa-clock" style="font-size:3rem; color:#f1c40f;"></i><h3>Menunggu Persetujuan</h3><p style="font-size:0.8rem;">Admin akan mengecek bukti TF Anda. Jika sesuai, link download akan dikirim otomatis ke sini.</p><button onclick="location.reload()" style="width:100%; padding:12px; background:#000; color:#fff; border-radius:10px; border:none;">OKE</button>\`;
        }
        load();
    </script></body></html>`);
});

// --- ADMIN DASHBOARD (PENGATURAN SEMPURNA) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const orders = await Order.find({status:'Pending'}).sort({_id:-1});
    res.send(`<body style="font-family:sans-serif; background:#f0f2f5; padding:20px;"><div style="max-width:450px; margin:auto;">
        <h2 style="text-align:center;">Admin E-Book</h2>
        <div style="background:#fff; padding:20px; border-radius:20px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            <h4 style="margin-top:0;">1. Tambah Buku Baru</h4>
            <form action="/admin/add" method="POST" style="display:grid; gap:10px;">
                <input name="judul" placeholder="Judul Buku" required style="padding:12px; border-radius:8px; border:1px solid #ddd;">
                <input name="penulis" placeholder="Nama Penulis" required style="padding:12px; border-radius:8px; border:1px solid #ddd;">
                <input name="harga" placeholder="Harga (Nominal: 2.500)" required style="padding:12px; border-radius:8px; border:1px solid #ddd;">
                <input name="gambar" placeholder="Link Gambar (ImgBB)" required style="padding:12px; border-radius:8px; border:1px solid #ddd;">
                <input name="pdfUrl" placeholder="Link PDF (Google Drive/Mediafire)" required style="padding:12px; border-radius:8px; border:1px solid #ddd;">
                <select name="genre" style="padding:12px; border-radius:8px; border:1px solid #ddd;">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                <button style="padding:15px; background:#000; color:#fff; border:none; border-radius:10px; font-weight:800;">SIMPAN BUKU</button>
            </form>
        </div>

        <h4 style="margin-top:30px;">2. Konfirmasi Pembayaran</h4>
        ${orders.length === 0 ? '<p style="color:#999; text-align:center;">Belum ada bukti TF masuk.</p>' : ''}
        ${orders.map(o => `<div style="background:#fff; padding:15px; border-radius:15px; margin-bottom:10px; border:1px solid #eee;">
            <p style="margin:0 0 10px 0;"><b>${o.judulBuku}</b></p>
            <a href="${o.bukti}" target="_blank" style="color:blue; text-decoration:none; font-size:0.8rem;">[Lihat Bukti Foto]</a><br><br>
            <a href="/admin/approve/${o._id}" style="display:inline-block; padding:10px 20px; background:#2ecc71; color:#fff; text-decoration:none; border-radius:8px; font-weight:800;">SETUJUI & SELESAI</a>
        </div>`).join('')}
    </div></body>`);
});

app.post('/admin/add', async (req, res) => {
    if(req.session.admin) {
        const cleanHarga = Number(req.body.harga.replace(/[^0-9]/g, ''));
        await new Buku({ ...req.body, harga: cleanHarga }).save();
    }
    res.redirect('/admin');
});

app.get('/admin/approve/:id', async (req, res) => {
    if(req.session.admin) {
        await Order.findByIdAndUpdate(req.params.id, { status: 'Approved' });
    }
    res.redirect('/admin');
});

// --- LOGIN & API LAINNYA ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;"><form action="/login" method="POST" style="background:#fff; padding:40px; border-radius:25px; text-align:center; width:300px;"><h2>Admin</h2><input name="pw" type="password" placeholder="Pass" style="width:100%; padding:15px; margin:20px 0; border-radius:10px; border:1px solid #ddd;"><button style="width:100%; padding:15px; background:#3b82f6; color:#fff; border:none; border-radius:10px; font-weight:800;">LOGIN</button></form></body>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/api/order', async (req, res) => {
    const buku = await Buku.findById(req.body.bukuId);
    await new Order({ bukuId: req.body.bukuId, judulBuku: buku.judul, bukti: req.body.bukti }).save();
    res.json({ success: true });
});

app.listen(process.env.PORT || 3000);

