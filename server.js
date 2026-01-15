const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

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
app.use(cookieSession({ name: 'jestri_vFinal_Fix', keys: ['JESTRI_SECURE_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (FULL FIX & IKON MUNCUL) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #f8fafc; color: #1e293b; }
        
        /* HEADER */
        .header { position: sticky; top: 0; background: #fff; z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .logo { font-weight: 800; font-size: 1.2rem; color: #0f172a; letter-spacing: -1px; }

        /* KATEGORI SCROLL */
        .cat-bar { display: flex; overflow-x: auto; padding: 10px 20px; gap: 10px; background: #fff; scrollbar-width: none; border-bottom: 1px solid #f1f5f9; }
        .cat-bar::-webkit-scrollbar { display: none; }
        .cat-btn { padding: 8px 18px; border-radius: 20px; background: #f1f5f9; border: none; font-size: 0.8rem; font-weight: 600; white-space: nowrap; cursor: pointer; }
        .cat-btn.active { background: #0f172a; color: #fff; }

        /* GRID BUKU */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; max-width: 900px; margin: auto; }
        .card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #e2e8f0; }
        .card-body { padding: 12px; }
        .card-title { font-size: 0.85rem; font-weight: 700; height: 2.5em; overflow: hidden; margin-bottom: 5px; }
        .card-price { color: #10b981; font-weight: 800; font-size: 0.95rem; }
        .btn-buy { width: 100%; margin-top: 10px; padding: 10px; border-radius: 12px; border: none; background: #0f172a; color: #fff; font-weight: 700; cursor: pointer; font-size: 0.75rem; }

        /* IKON SOSIAL MEDIA MENGAMBANG */
        .float-soc { position: fixed; bottom: 25px; left: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 999; }
        .soc-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.4rem; text-decoration: none; box-shadow: 0 8px 20px rgba(0,0,0,0.2); transition: 0.3s; }
        .soc-btn:active { transform: scale(0.9); }
        .wa { background: #22c55e; }
        .ig { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }

        /* MODAL */
        #modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px); }
        .modal-box { background: #fff; width: 100%; max-width: 380px; border-radius: 28px; padding: 30px; text-align: center; }
        .pay-step { background: #f8fafc; padding: 15px; border-radius: 18px; text-align: left; margin-top: 15px; border: 1px dashed #cbd5e1; }
    </style></head><body>

    <div class="header">
        <div class="logo">JESTRI E-BOOK</div>
        <i class="fa-solid fa-shopping-cart" style="font-size: 1.2rem; color: #64748b;"></i>
    </div>

    <div class="cat-bar">
        <button class="cat-btn active" onclick="filterG('Semua', this)">Semua</button>
        ${LIST_GENRE.map(g => `<button class="cat-btn" onclick="filterG('${g}', this)">${g}</button>`).join('')}
    </div>

    <div class="grid" id="bookGrid"></div>

    <div class="float-soc">
        <a href="https://wa.me/6285189415489" class="soc-btn wa"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="soc-btn ig"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal">
        <div class="modal-box" id="modalContent">
            <h3 id="mTitle" style="margin:0"></h3>
            <p id="mPrice" style="color:#10b981; font-weight:800; font-size:1.2rem; margin:10px 0"></p>
            <div class="pay-step">
                <p style="font-size:0.8rem; margin:0 0 10px 0;">Silahkan transfer ke DANA/GOPAY:<br><b>0895327806441</b></p>
                <input type="file" id="buktiInput" style="width:100%; font-size:0.75rem;">
            </div>
            <button onclick="bayarNow()" id="payBtn" style="width:100%; padding:16px; background:#0f172a; color:#fff; border-radius:15px; border:none; margin-top:20px; font-weight:800; cursor:pointer;">KONFIRMASI PEMBAYARAN</button>
            <button onclick="document.getElementById('modal').style.display='none'" style="margin-top:15px; border:none; background:none; color:#94a3b8; font-weight:600;">Kembali</button>
        </div>
    </div>

    <script>
        let books = []; let selectedId = '';
        async function getBooks(){ const r = await fetch('/api/buku-json'); books = await r.json(); render(); }
        
        function render(filter = 'Semua'){
            const grid = document.getElementById('bookGrid');
            const filtered = filter === 'Semua' ? books : books.filter(b => b.genre === filter);
            if(filtered.length === 0) { grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:50px;">Buku tidak ditemukan.</p>'; return; }
            grid.innerHTML = filtered.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/300x400?text=No+Image'">
                    <div class="card-body">
                        <div class="card-title">\${x.judul}</div>
                        <div class="card-price">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                        <button class="btn-buy" onclick="openBuy('\${x._id}','\${x.judul}','\${x.harga}')">BELI SEKARANG</button>
                    </div>
                </div>
            \`).join('');
        }

        function filterG(g, btn){
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            render(g);
        }

        function openBuy(id, j, h){
            selectedId = id;
            document.getElementById('mTitle').innerText = j;
            document.getElementById('mPrice').innerText = 'Rp ' + Number(h).toLocaleString('id-ID');
            document.getElementById('modal').style.display = 'flex';
        }

        async function bayarNow(){
            const file = document.getElementById('buktiInput').files[0];
            if(!file) return alert("Pilih bukti transfer!");
            const btn = document.getElementById('payBtn');
            btn.innerText = "Mengirim..."; btn.disabled = true;

            const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const imgData = await up.json();

            const res = await fetch('/api/order', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ bukuId: selectedId, bukti: imgData.secure_url })
            });
            const order = await res.json();

            document.getElementById('modalContent').innerHTML = \`
                <h3>Pembayaran Terkirim!</h3>
                <p style="font-size:0.85rem; color:#64748b;">Mohon tunggu sebentar, Admin sedang memvalidasi. Link download akan muncul otomatis di bawah.</p>
                <div id="statusArea"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
            \`;

            const check = setInterval(async () => {
                const rs = await fetch('/api/order-status/' + order.id);
                const s = await rs.json();
                if(s.status === 'Approved'){
                    clearInterval(check);
                    const linkFix = s.pdfLink.replace('/upload/', '/upload/fl_attachment/');
                    document.getElementById('statusArea').innerHTML = \`
                        <a href="\${linkFix}" download style="display:block; background:#10b981; color:#fff; padding:18px; border-radius:15px; text-decoration:none; font-weight:800; margin-top:20px;">SIMPAN PDF KE HP <i class="fa-solid fa-download"></i></a>
                    \`;
                }
            }, 3000);
        }
        getBooks();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (FIXED & TERKUNCI) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { background:#0f172a; margin:0; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; }
        .box { background:#1e293b; padding:40px; border-radius:30px; text-align:center; width:85%; max-width:320px; border:1px solid #334155; }
        input { width:100%; padding:15px; margin:20px 0; border-radius:15px; border:1px solid #334155; background:#0f172a; color:#fff; text-align:center; box-sizing:border-box; font-size:18px; outline:none; }
        button { width:100%; padding:15px; border-radius:15px; background:#38bdf8; border:none; font-weight:800; cursor:pointer; }
    </style></head><body><div class="box">
        <h2 style="color:#fff; margin:0;">Admin Access</h2>
        <form action="/login" method="POST">
            <input name="pw" type="password" placeholder="Password" required autofocus>
            <button>MASUK</button>
        </form>
    </div></body></html>`);
});

// --- 3. DASHBOARD ADMIN (LENGKAP) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { box-sizing: border-box; }
        body { font-family: sans-serif; background: #0b0f19; color: #fff; padding: 15px; margin: 0; }
        .container { max-width: 450px; margin: auto; }
        .card { background: #161e2d; padding: 25px; border-radius: 20px; border: 1px solid #2d3748; margin-bottom: 20px; }
        input, select { width: 100%; padding: 14px; margin: 8px 0 15px; border-radius: 12px; border: 1px solid #2d3748; background: #0b0f19; color: #fff; outline:none; }
        .btn-up { width: 100%; padding: 16px; border-radius: 14px; background: #38bdf8; color: #000; font-weight: 800; border:none; cursor:pointer; }
        .order-item { background: #161e2d; padding: 15px; border-radius: 15px; margin-bottom: 10px; border-left: 5px solid #38bdf8; }
        .btn-acc { background: #10b981; color:#fff; padding:10px 15px; border-radius:10px; text-decoration:none; font-size:0.75rem; font-weight:bold; display:inline-block; margin-top:10px; }
        .btn-rej { background: #ef4444; color:#fff; padding:10px 15px; border-radius:10px; text-decoration:none; font-size:0.75rem; font-weight:bold; display:inline-block; margin-top:10px; margin-left:10px; }
    </style></head><body>
    <div class="container">
        <h2 style="text-align:center; color:#38bdf8;">JESTRI ADMIN</h2>
        <div class="card">
            <h3><i class="fa-solid fa-plus"></i> Tambah Buku</h3>
            <label>1. JUDUL BUKU</label><input id="j">
            <label>2. PENULIS</label><input id="p">
            <label>3. HARGA (Angka)</label><input id="h" placeholder="5000">
            <label>4. GAMBAR (PILIH GALERI)</label><input type="file" id="fi" accept="image/*">
            <label>5. PDF (FILE E-BOOK)</label><input type="file" id="fp" accept=".pdf">
            <label>GENRE</label><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
            <button class="btn-up" onclick="up()">SIMPAN DATA BUKU</button>
        </div>

        <h3 style="color:#38bdf8;">Menunggu Persetujuan (${o.length})</h3>
        ${o.map(x => `<div class="order-item">
            <div style="font-size:0.9rem;"><b>${x.judulBuku}</b></div>
            <a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.75rem;">Lihat Bukti TF</a><br>
            <a href="/admin/approve/${x._id}" class="btn-acc">SETUJUI</a>
            <a href="/admin/reject/${x._id}" class="btn-rej">TOLAK</a>
        </div>`).join('')}

        <h3 style="color:#ef4444; margin-top:30px;">Katalog Buku</h3>
        ${b.map(x => `<div class="order-item" style="display:flex; justify-content:space-between; align-items:center;">
            <span>${x.judul}</span>
            <a href="/admin/del/${x._id}" style="color:#ef4444;"><i class="fa-solid fa-trash"></i></a>
        </div>`).join('')}
    </div>
    <script>
        async function up(){
            const fi = document.getElementById('fi').files[0]; const fp = document.getElementById('fp').files[0];
            if(!fi || !fp) return alert("File belum lengkap!");
            const btn = document.querySelector('.btn-up'); btn.innerText = "Processing..."; btn.disabled = true;
            
            const fdI = new FormData(); fdI.append('file', fi); fdI.append('upload_preset', 'ml_default');
            const resI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fdI});
            const dataI = await resI.json();

            const fdP = new FormData(); fdP.append('file', fp); fdP.append('upload_preset', 'ml_default');
            const resP = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload', {method:'POST', body:fdP});
            const dataP = await resP.json();

            await fetch('/admin/save-buku', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:document.getElementById('h').value, genre:document.getElementById('g').value, gambar:dataI.secure_url, pdfUrl:dataP.secure_url}) });
            location.reload();
        }
    </script></body></html>`);
});

// --- 4. BACKEND API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save-buku', async (req, res) => {
    if(!req.session.admin) return res.status(403).send("No");
    await new Buku({ ...req.body, harga: Number(req.body.harga) }).save();
    res.json({ success: true });
});
app.get('/admin/approve/:id', async (req, res) => {
    const o = await Order.findById(req.params.id); const b = await Buku.findById(o.bukuId);
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: b.pdfUrl });
    res.redirect('/admin');
});
app.get('/admin/reject/:id', async (req, res) => {
    if(req.session.admin) await Order.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });
app.get('/api/buku-json', async (req, res) => { res.json(await Buku.find().sort({_id:-1})); });
app.post('/api/order', async (req, res) => {
    const b = await Buku.findById(req.body.bukuId);
    const o = new Order({ bukuId: req.body.bukuId, judulBuku: b.judul, bukti: req.body.bukti });
    await o.save(); res.json({ id: o._id });
});
app.get('/api/order-status/:id', async (req, res) => { res.json(await Order.findById(req.params.id)); });

app.listen(process.env.PORT || 3000);

