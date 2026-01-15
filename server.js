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
app.use(cookieSession({ name: 'jestri_vFinal_Side', keys: ['JESTRI_MASTER_KEY_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (SIDEBAR VERSION) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI E-BOOK</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: #1e293b; overflow-x: hidden; }
        
        /* SIDEBAR LOGIC */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #fff; z-index: 2000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; box-shadow: 10px 0 30px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1500; display: none; backdrop-filter: blur(3px); }
        .overlay.active { display: block; }

        /* HEADER */
        .header { position: sticky; top: 0; background: #fff; z-index: 1000; padding: 15px 20px; display: flex; align-items: center; gap: 20px; border-bottom: 1px solid #f1f5f9; }
        .header b { font-size: 1.2rem; }

        /* MENU ITEMS */
        .menu-title { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; }
        .genre-link { display: block; padding: 12px 15px; border-radius: 12px; text-decoration: none; color: #475569; font-weight: 600; margin-bottom: 5px; transition: 0.2s; }
        .genre-link.active { background: #0f172a; color: #fff; }

        /* GRID CONTENT */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px; max-width: 900px; margin: auto; }
        .card { background: #fff; border-radius: 18px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .info { padding: 12px; }
        .title { font-size: 0.8rem; font-weight: 700; height: 2.4em; overflow: hidden; margin-bottom: 5px; }
        .price { color: #10b981; font-weight: 800; }
        .btn-buy { width: 100%; margin-top: 10px; padding: 10px; border-radius: 12px; border: none; background: #0f172a; color: #fff; font-weight: 800; font-size: 0.75rem; }

        /* EMPTY MESSAGE */
        .empty-state { grid-column: 1/-1; text-align: center; padding: 100px 20px; color: #94a3b8; }

        /* FLOATING SOSMED */
        .float-soc { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 1100; }
        .soc-btn { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.3rem; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

        /* MODAL */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 3000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .m-box { background: #fff; width: 100%; max-width: 350px; border-radius: 25px; padding: 25px; text-align: center; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="toggleSidebar()"></div>
    
    <div class="sidebar" id="sb">
        <div class="menu-title">Kategori E-Book</div>
        <a href="#" class="genre-link active" onclick="selectG('Semua', this)">Semua Koleksi</a>
        ${LIST_GENRE.map(g => `<a href="#" class="genre-link" onclick="selectG('${g}', this)">${g}</a>`).join('')}
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="toggleSidebar()" style="font-size:1.4rem; cursor:pointer;"></i>
        <b id="headTitle">JESTRI STORE</b>
    </div>

    <div class="grid" id="mainGrid"></div>

    <div class="float-soc">
        <a href="https://wa.me/6285189415489" class="soc-btn" style="background:#22c55e"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="soc-btn" style="background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal">
        <div class="m-box" id="mContent">
            <h3 id="mJudul" style="margin:0"></h3>
            <p id="mHarga" style="color:#10b981; font-weight:800; font-size:1.2rem; margin:10px 0"></p>
            <div style="background:#f8fafc; padding:15px; border-radius:15px; text-align:left; border:1px dashed #cbd5e1;">
                <p style="font-size:0.75rem; margin:0 0 10px 0;">Transfer DANA/OVO/GOPAY:<br><b>0895327806441</b></p>
                <input type="file" id="fBukti" style="width:100%; font-size:0.75rem;">
            </div>
            <button onclick="prosesBayar()" id="btnBayar" style="width:100%; padding:15px; background:#0f172a; color:#fff; border-radius:12px; border:none; margin-top:20px; font-weight:800;">KONFIRMASI BAYAR</button>
            <button onclick="location.reload()" style="margin-top:10px; border:none; background:none; color:#94a3b8;">Batal</button>
        </div>
    </div>

    <script>
        let dataBuku = []; let idTerpilih = '';
        function toggleSidebar(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }

        async function fetchBuku(){ const r = await fetch('/api/buku-json'); dataBuku = await r.json(); render('Semua'); }
        
        function selectG(g, el){
            document.querySelectorAll('.genre-link').forEach(a => a.classList.remove('active'));
            el.classList.add('active');
            if(window.innerWidth < 1000) toggleSidebar();
            render(g);
        }

        function render(g){
            const grid = document.getElementById('mainGrid');
            const filtered = g === 'Semua' ? dataBuku : dataBuku.filter(b => b.genre === g);
            
            if(filtered.length === 0){
                grid.innerHTML = \`<div class="empty-state">
                    <i class="fa-solid fa-book-open" style="font-size:3rem; opacity:0.2; margin-bottom:15px; display:block;"></i>
                    <p style="font-weight:700;">Genre \${g} Belum Ada</p>
                </div>\`;
            } else {
                grid.innerHTML = filtered.map(x => \`
                    <div class="card">
                        <img src="\${x.gambar}">
                        <div class="info">
                            <div class="title">\${x.judul}</div>
                            <div class="price">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                            <button class="btn-buy" onclick="openBeli('\${x._id}','\${x.judul}','\${x.harga}')">BELI</button>
                        </div>
                    </div>
                \`).join('');
            }
        }

        function openBeli(id, j, h){
            idTerpilih = id;
            document.getElementById('mJudul').innerText = j;
            document.getElementById('mHarga').innerText = 'Rp ' + Number(h).toLocaleString('id-ID');
            document.getElementById('modal').style.display = 'flex';
        }

        async function prosesBayar(){
            const file = document.getElementById('fBukti').files[0];
            if(!file) return alert("Pilih foto bukti transfer!");
            const btn = document.getElementById('btnBayar'); btn.innerText = "Processing..."; btn.disabled = true;
            
            const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const iD = await up.json();

            const res = await fetch('/api/order', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ bukuId: idTerpilih, bukti: iD.secure_url })
            });
            const ord = await res.json();

            document.getElementById('mContent').innerHTML = \`<h3>Menunggu Admin</h3><p style="font-size:0.8rem; color:#64748b;">Validasi sedang berjalan. Link download akan muncul di bawah ini.</p><div id="statArea" style="margin-top:20px;"><i class="fas fa-circle-notch fa-spin fa-2x"></i></div>\`;

            const cek = setInterval(async () => {
                const rs = await fetch('/api/order-status/' + ord.id);
                const s = await rs.json();
                if(s.status === 'Approved'){
                    clearInterval(cek);
                    const linkFix = s.pdfLink.replace('/upload/', '/upload/fl_attachment/');
                    document.getElementById('statArea').innerHTML = \`<a href="\${linkFix}" download style="display:block; background:#10b981; color:#fff; padding:15px; border-radius:12px; text-decoration:none; font-weight:800;">SIMPAN PDF <i class="fa-solid fa-download"></i></a>\`;
                }
            }, 3000);
        }
        fetchBuku();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (FIXED CENTER) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { background:#0f172a; margin:0; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; overflow:hidden; }
        .box { background:#1e293b; padding:40px; border-radius:30px; text-align:center; width:85%; max-width:320px; border:1px solid #334155; }
        input { width:100%; padding:15px; margin:20px 0; border-radius:15px; border:1px solid #334155; background:#0f172a; color:#fff; text-align:center; box-sizing:border-box; font-size:18px; outline:none; }
        button { width:100%; padding:15px; border-radius:15px; background:#38bdf8; border:none; font-weight:800; }
    </style></head><body><div class="box">
        <h2 style="color:#fff; margin:0;">Admin Jestri</h2>
        <form action="/login" method="POST"><input name="pw" type="password" required autofocus><button>MASUK</button></form>
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
        .item { background: #161e2d; padding: 15px; border-radius: 15px; margin-bottom: 10px; border-left: 5px solid #38bdf8; }
        .btn-acc { background: #10b981; color:#fff; padding:8px 15px; border-radius:10px; text-decoration:none; font-size:0.75rem; font-weight:bold; }
        .btn-rej { background: #ef4444; color:#fff; padding:8px 15px; border-radius:10px; text-decoration:none; font-size:0.75rem; font-weight:bold; margin-left:10px; }
    </style></head><body>
    <div class="container">
        <h2 style="text-align:center; color:#38bdf8;">JESTRI ADMIN</h2>
        <div class="card">
            <label>1. JUDUL BUKU</label><input id="j">
            <label>2. PENULIS</label><input id="p">
            <label>3. HARGA</label><input id="h" placeholder="5000">
            <label>4. GAMBAR (GALERI)</label><input type="file" id="fi">
            <label>5. PDF (FILE HP)</label><input type="file" id="fp">
            <label>GENRE</label><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
            <button class="btn-up" onclick="up()">UPLOAD BUKU</button>
        </div>
        <h3>Konfirmasi Pembayaran (${o.length})</h3>
        ${o.map(x => `<div class="item">
            <b>${x.judulBuku}</b><br><br>
            <a href="/admin/approve/${x._id}" class="btn-acc">SETUJUI</a>
            <a href="/admin/reject/${x._id}" class="btn-rej">TOLAK</a>
            <a href="${x.bukti}" target="_blank" style="color:#38bdf8; float:right; font-size:0.7rem;">Cek Bukti</a>
        </div>`).join('')}
        <h3 style="color:#ef4444; margin-top:30px;">Katalog Buku</h3>
        ${b.map(x => `<div class="item" style="display:flex; justify-content:space-between;">
            <span>${x.judul}</span>
            <a href="/admin/del/${x._id}" style="color:#ef4444;"><i class="fa-solid fa-trash"></i></a>
        </div>`).join('')}
    </div>
    <script>
        async function up(){
            const fi = document.getElementById('fi').files[0]; const fp = document.getElementById('fp').files[0];
            if(!fi || !fp) return alert("File belum lengkap!");
            const btn = document.querySelector('.btn-up'); btn.innerText = "Mengunggah..."; btn.disabled = true;
            
            const fdI = new FormData(); fdI.append('file', fi); fdI.append('upload_preset', 'ml_default');
            const rI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fdI});
            const dI = await rI.json();

            const fdP = new FormData(); fdP.append('file', fp); fdP.append('upload_preset', 'ml_default');
            const rP = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload', {method:'POST', body:fdP});
            const dP = await rP.json();

            await fetch('/admin/save-buku', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:document.getElementById('h').value, genre:document.getElementById('g').value, gambar:dI.secure_url, pdfUrl:dP.secure_url}) });
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

