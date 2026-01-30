const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- KONFIGURASI DATABASE (DITAMBAH ERROR LOG) ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Database Terhubung"))
    .catch(err => console.error("❌ Gagal Koneksi DB:", err));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const Order = mongoose.model('Order', { 
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String, pdfLink: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

// --- MIDDLEWARE (FIX PAYLOAD LIMIT) ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ 
    name: 'jestri_session', 
    keys: ['SECRET_JESTRI_2026'], 
    maxAge: 24 * 60 * 60 * 1000 
}));

// --- 1. TAMPILAN PEMBELI (UI/UX PROFESIONAL) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI E-BOOK STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --p: #38bdf8; --d: #0f172a; --bg: #f8fafc; --text: #1e293b; --success: #10b981; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--text); overflow-x: hidden; }

        /* Header & Search */
        header { background: var(--d); padding: 15px 20px; position: sticky; top: 0; z-index: 1000; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-weight: 800; color: var(--p); font-size: 1.2rem; }
        .cart-icon { position: relative; color: white; cursor: pointer; font-size: 1.3rem; }
        .badge { position: absolute; top: -5px; right: -8px; background: #ef4444; color: white; font-size: 0.6rem; padding: 2px 5px; border-radius: 50%; font-weight: 800; }
        
        .search-section { background: var(--d); padding: 0 20px 15px; }
        .search-bar { background: #1e293b; border-radius: 12px; padding: 10px 15px; display: flex; align-items: center; border: 1px solid #334155; }
        .search-bar input { background: none; border: none; color: white; width: 100%; outline: none; margin-left: 10px; }

        /* Sidebar Navigation */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.3s; padding: 25px; }
        .sidebar.active { left: 0; box-shadow: 10px 0 50px rgba(0,0,0,0.2); }
        .nav-title { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin: 20px 0 10px; }
        .nav-link { padding: 12px 15px; border-radius: 10px; cursor: pointer; color: #475569; font-weight: 600; display: block; text-decoration: none; }
        .nav-link.active { background: var(--p); color: white; }

        /* Grid Buku */
        .container { padding: 15px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f1f5f9; }
        .card-body { padding: 10px; flex-grow: 1; display: flex; flex-direction: column; }
        .card-title { font-size: 0.8rem; font-weight: 700; height: 2.6em; overflow: hidden; line-height: 1.3; }
        .card-price { color: var(--success); font-weight: 800; font-size: 0.95rem; margin: 5px 0 10px; }
        .btn-buy { width: 100%; padding: 8px; border: none; border-radius: 8px; background: var(--d); color: white; font-weight: 700; font-size: 0.7rem; cursor: pointer; }

        /* Empty State */
        .empty { grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #94a3b8; }
        .empty i { font-size: 3rem; margin-bottom: 10px; }

        /* Modal */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .modal-box { background: white; width: 100%; max-width: 380px; border-radius: 20px; padding: 25px; max-height: 85vh; overflow-y: auto; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 4500; display: none; backdrop-filter: blur(4px); }

        /* Sosmed */
        .sosmed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 4000; }
        .btn-sos { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.4rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    <aside class="sidebar" id="sb">
        <h2 style="margin:0;">MENU</h2>
        <div class="nav-title">Kategori</div>
        <div class="nav-link active" onclick="setG('Semua', this)">Semua Buku</div>
        ${LIST_GENRE.map(g => `<div class="nav-link" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" class="nav-link" style="margin-top:20px; background:#fbbf24; color:black; text-align:center;">DONASI ADMIN</a>
    </aside>

    <header>
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="color:white; cursor:pointer;"></i>
        <div class="logo">JESTRI E-BOOK</div>
        <div class="cart-icon" onclick="openCart()"><i class="fa-solid fa-cart-shopping"></i><span id="cc" class="badge">0</span></div>
    </header>

    <div class="search-section"><div class="search-bar"><i class="fa-solid fa-search" style="color:#64748b;"></i><input type="text" id="sr" placeholder="Cari buku..." oninput="cari()"></div></div>

    <main class="container"><div id="mainGrid" class="grid"></div></main>

    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="btn-sos" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="btn-sos" style="background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal"><div class="modal-box">
        <h3 style="margin-top:0;">Ringkasan Order</h3>
        <div id="cItems" style="font-size:0.85rem; color:#475569; margin-bottom:15px;"></div>
        <p>Total: <b id="cTotal" style="color:var(--success);"></b></p>
        <label style="font-size:0.7rem; font-weight:800;">METODE PEMBAYARAN:</label>
        <select id="wlt" style="width:100%; padding:10px; margin:8px 0; border-radius:10px; border:1px solid #ddd;">
            <option value="DANA">DANA (0895327806441)</option>
            <option value="OVO">OVO (0895327806441)</option>
            <option value="GOPAY">GOPAY (0895327806441)</option>
        </select>
        <label style="font-size:0.7rem; font-weight:800;">BUKTI TF:</label>
        <input type="file" id="fBukti" style="display:block; margin:10px 0;">
        <button onclick="checkout()" id="btnC" style="width:100%; padding:14px; background:var(--success); color:white; border:none; border-radius:12px; font-weight:800; cursor:pointer;">KONFIRMASI BAYAR</button>
        <button onclick="location.reload()" style="width:100%; border:none; background:none; color:gray; margin-top:10px;">Batal</button>
    </div></div>

    <script>
        let allB = []; let cart = []; let curG = 'Semua';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ try { const r = await fetch('/api/buku-json?v='+Date.now()); allB = await r.json(); render(allB); } catch(e) { console.error(e); } }

        function render(data){
            const g = document.getElementById('mainGrid');
            if(data.length === 0){
                g.innerHTML = \`<div class="empty"><i class="fa-solid fa-book-open"></i><p>Buku dengan genre \${curG} belum ada</p></div>\`;
                return;
            }
            g.innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" loading="lazy" onerror="this.src='https://placehold.co/400x600?text=JESTRI'">
                    <div class="card-body">
                        <div class="card-title">\${x.judul}</div>
                        <div class="card-price">Rp \${new Intl.NumberFormat('id-ID').format(x.harga)}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">BELI BUKU</button>
                    </div>
                </div>\`).join('');
        }

        function cari(){
            const k = document.getElementById('sr').value.toLowerCase();
            render(allB.filter(b => b.judul.toLowerCase().includes(k) || b.penulis.toLowerCase().includes(k)));
        }

        function setG(g, el){
            curG = g;
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g));
            tog();
        }

        function add(id){
            if(cart.some(i => i._id === id)) return;
            cart.push(allB.find(x => x._id === id));
            document.getElementById('cc').innerText = cart.length;
        }

        function openCart(){
            if(cart.length === 0) return alert("Pilih buku!");
            document.getElementById('cItems').innerHTML = cart.map(x => \`<div>• \${x.judul}</div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Upload bukti!");
            const btn = document.getElementById('btnC'); btn.disabled = true; btn.innerText = "Sabar, Uploading...";
            try {
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                const res = await fetch('/api/order', {
                    method: 'POST', headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url, wallet: document.getElementById('wlt').value })
                });
                const order = await res.json();
                document.getElementById('modal').innerHTML = '<div style="text-align:center;"><h3>Sip, Berhasil!</h3><p>Admin lagi cek bukti transfer lo. Jangan ditutup.</p><div id="dl-box" style="font-size:1.5rem;">⏳</div></div>';
                const cek = setInterval(async () => {
                    const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                    if(st.status === 'Approved'){ clearInterval(cek); document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block;background:var(--d);color:white;padding:15px;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:15px;">DOWNLOAD PDF</a>\`; }
                }, 3000);
            } catch(e) { alert("Waduh, gagal upload! Coba lagi."); btn.disabled = false; btn.innerText = "KONFIRMASI BAYAR"; }
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (FIX SIZE UNTUK HP) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; margin:0; display:flex; align-items:center; justify-content:center; height:100vh; width:100vw; position:fixed;">
    <form action="/login" method="POST" style="background:white; padding:40px 30px; border-radius:24px; width:90%; max-width:350px; text-align:center; box-sizing:border-box;">
        <h2 style="margin:0 0 10px; font-family:sans-serif;">ADMIN JESTRI</h2>
        <p style="color:gray; font-size:0.8rem; margin-bottom:25px;">Masukkan passcode khusus admin</p>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:16px; border:2px solid #f1f5f9; border-radius:12px; text-align:center; font-size:1.2rem; outline:none; box-sizing:border-box;">
        <button style="width:100%; padding:16px; background:#38bdf8; color:white; border:none; border-radius:12px; font-weight:800; margin-top:20px; cursor:pointer;">MASUK</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (FITUR SETUJU/TOLAK FIX) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body{font-family:sans-serif; background:#f1f5f9; padding:15px; margin:0;}
        .box{background:white; padding:20px; border-radius:18px; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);}
        input, select{width:100%; padding:14px; margin:8px 0; border:1px solid #ddd; border-radius:12px; box-sizing:border-box;}
        .btn-acc{background:#10b981; color:white; border:none; padding:12px; border-radius:10px; width:100%; font-weight:bold; cursor:pointer; margin-top:10px;}
        .btn-del{background:none; border:none; color:red; cursor:pointer; font-weight:bold;}
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center;"><h2>ADMIN PANEL</h2><a href="/">Toko</a></div>

    <div class="box">
        <h3>Input E-book</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Penulis">
        <input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(x=>`<option>${x}</option>`).join('')}</select>
        <input type="file" id="fi" accept="image/*">
        <button onclick="addB()" id="btnS" style="width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:bold;">POSTING SEKARANG</button>
    </div>

    <h3>Pesanan Menunggu (\${o.length})</h3>
    ${o.map(x => `<div class="box" style="border-left:5px solid #fbbf24;">
        <b>\${x.wallet} - Rp \${x.total}</b><br>
        <a href="\${x.bukti}" target="_blank" style="color:#38bdf8; display:block; margin:10px 0;">Lihat Bukti TF <i class="fa-solid fa-image"></i></a>
        <input type="file" id="pdf-\${x._id}" accept=".pdf">
        <button onclick="acc('\${x._id}')" class="btn-acc">SETUJUI & KIRIM PDF</button>
        <button onclick="delO('\${x._id}')" style="width:100%; border:none; color:red; margin-top:10px; font-weight:bold;">TOLAK PESANAN</button>
    </div>`).join('')}

    <h3>Katalog Koleksi</h3>
    <div class="box">
        ${b.map(x => `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
            <div><b>${x.judul}</b></div>
            <button onclick="delB('${x._id}')" class="btn-del">HAPUS</button>
        </div>`).join('')}
    </div>

    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.disabled=true; btn.innerText="Uploading...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih PDF!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delB(id){ if(confirm('Hapus buku?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
        async function delO(id){ if(confirm('Tolak pesanan?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ROUTES ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port \${PORT}`));

