const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DB CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI);

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const Order = mongoose.model('Order', { 
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String, pdfLink: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_premium_fix', keys: ['JESTRI_MASTER_UX'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (HIGH-END UI) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI - Toko Buku Digital</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --p: #38bdf8; --d: #0f172a; --g: #64748b; --bg: #f8fafc; --success: #10b981; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--d); }

        /* Navigation */
        header { background: var(--d); padding: 18px 20px; position: sticky; top: 0; z-index: 1000; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-weight: 800; color: var(--p); font-size: 1.2rem; letter-spacing: -0.5px; }
        .cart-btn { position: relative; color: white; font-size: 1.3rem; cursor: pointer; }
        .badge { position: absolute; top: -8px; right: -10px; background: #ef4444; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 50%; font-weight: 800; }

        /* Search & Filter */
        .search-container { background: var(--d); padding: 0 20px 20px; }
        .search-box { background: #1e293b; border-radius: 14px; padding: 12px 18px; display: flex; align-items: center; border: 1px solid #334155; }
        .search-box input { background: none; border: none; color: white; width: 100%; outline: none; margin-left: 10px; font-size: 0.95rem; }

        /* Sidebar */
        .sidebar { position: fixed; top: 0; left: -300px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; }
        .sidebar.active { left: 0; box-shadow: 20px 0 60px rgba(0,0,0,0.2); }
        .nav-label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 25px 0 10px 5px; }
        .nav-item { padding: 14px 18px; border-radius: 12px; margin-bottom: 6px; cursor: pointer; color: #475569; font-weight: 600; transition: 0.2s; }
        .nav-item.active { background: var(--p); color: white; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3); }

        /* Content Grid */
        .container { padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .card { background: white; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .card:active { transform: scale(0.96); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f1f5f9; }
        .card-info { padding: 12px; flex-grow: 1; display: flex; flex-direction: column; }
        .card-title { font-size: 0.85rem; font-weight: 700; height: 2.6em; overflow: hidden; color: var(--d); line-height: 1.3; }
        .card-author { font-size: 0.7rem; color: var(--g); margin: 4px 0 8px; }
        .card-price { font-size: 1rem; font-weight: 800; color: var(--success); margin-bottom: 12px; }
        .btn-buy { width: 100%; padding: 10px; border: none; border-radius: 10px; background: var(--d); color: white; font-weight: 700; font-size: 0.75rem; cursor: pointer; }

        /* Empty State */
        .empty { grid-column: 1/-1; text-align: center; padding: 100px 20px; color: #94a3b8; }
        .empty i { font-size: 3.5rem; margin-bottom: 15px; opacity: 0.5; }

        /* Floating buttons */
        .fb { position: fixed; bottom: 25px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 4000; }
        .fb-btn { width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }

        /* Modal */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px); }
        .modal-card { background: white; width: 100%; max-width: 400px; border-radius: 28px; padding: 30px; animation: slideUp 0.3s; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .ov { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 4500; display: none; }
    </style></head><body>

    <div class="ov" id="ov" onclick="tog()"></div>

    <aside class="sidebar" id="sb">
        <h2 style="margin:0 0 20px 0; font-size:1.6rem; font-weight:800;">MENU</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        <div class="nav-label">GENRE</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; margin-top:30px; background:#fbbf24; color:black; padding:15px; border-radius:14px; text-align:center; text-decoration:none; font-weight:800; font-size:0.9rem;">DONASI ADMIN</a>
    </aside>

    <header>
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="color:white; font-size:1.4rem; cursor:pointer;"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div class="cart-btn" onclick="openCart()"><i class="fa-solid fa-bag-shopping"></i><span id="cc" class="badge">0</span></div>
    </header>

    <div class="search-container">
        <div class="search-box">
            <i class="fa-solid fa-magnifying-glass" style="color:#64748b;"></i>
            <input type="text" id="sr" placeholder="Cari judul buku atau penulis..." oninput="cari()">
        </div>
    </div>

    <main class="container">
        <div id="mainGrid" class="grid"></div>
    </main>

    <div class="fb">
        <a href="https://wa.me/6285189415489" class="fb-btn" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="fb-btn" style="background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal"><div class="modal-card">
        <h3 style="margin-top:0; font-size:1.4rem;">Checkout</h3>
        <div id="cItems" style="margin-bottom:20px; font-size:0.9rem; color:#475569; max-height:150px; overflow-y:auto;"></div>
        <div style="border-top:1px solid #f1f5f9; padding-top:15px; margin-bottom:20px;">
            <p>Total Bayar: <b id="cTotal" style="color:var(--success); font-size:1.3rem;"></b></p>
        </div>
        
        <label style="font-size:0.75rem; font-weight:800; color:#94a3b8;">METODE PEMBAYARAN:</label>
        <select id="wlt" style="width:100%; padding:14px; margin:10px 0 20px; border-radius:12px; border:1px solid #e2e8f0; outline:none; font-weight:600;">
            <option value="DANA">DANA (0895327806441)</option>
            <option value="OVO">OVO (0895327806441)</option>
            <option value="GOPAY">GOPAY (0895327806441)</option>
        </select>

        <label style="font-size:0.75rem; font-weight:800; color:#94a3b8;">BUKTI TRANSFER:</label>
        <input type="file" id="fBukti" style="display:block; margin-top:10px; font-size:0.8rem;">
        
        <button onclick="checkout()" id="btnC" style="width:100%; padding:16px; background:var(--success); color:white; border:none; border-radius:16px; font-weight:800; font-size:1rem; margin-top:25px;">KONFIRMASI PEMBAYARAN</button>
        <button onclick="location.reload()" style="width:100%; border:none; background:none; color:#94a3b8; margin-top:15px; font-weight:600;">Batal</button>
    </div></div>

    <script>
        let allB = []; let cart = []; let curG = 'Semua';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ const r = await fetch('/api/buku-json?v='+Date.now()); allB = await r.json(); render(allB); }

        function render(data){
            const g = document.getElementById('mainGrid');
            if(data.length === 0){
                g.innerHTML = \`<div class="empty"><i class="fa-solid fa-book-open"></i><p>Buku dengan genre <b>\${curG}</b> belum ada</p></div>\`;
                return;
            }
            g.innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" loading="lazy" onerror="this.src='https://placehold.co/400x600?text=JESTRI'">
                    <div class="card-info">
                        <div class="card-title">\${x.judul}</div>
                        <div class="card-author">\${x.penulis}</div>
                        <div class="card-price">Rp \${new Intl.NumberFormat('id-ID').format(x.harga)}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">AMBIL BUKU</button>
                    </div>
                </div>\`).join('');
        }

        function cari(){
            const k = document.getElementById('sr').value.toLowerCase();
            render(allB.filter(b => b.judul.toLowerCase().includes(k) || b.penulis.toLowerCase().includes(k)));
        }

        function setG(g, el){
            curG = g;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
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
            if(cart.length === 0) return alert("Pilih buku dulu!");
            document.getElementById('cItems').innerHTML = cart.map(x => \`<div style="margin-bottom:8px; border-bottom:1px dashed #eee; padding-bottom:5px;">• \${x.judul}</div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Upload bukti transfer!");
            const btn = document.getElementById('btnC'); btn.disabled = true; btn.innerText = "Processing...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url, wallet: document.getElementById('wlt').value })
            });
            const order = await res.json();
            document.getElementById('modal').innerHTML = '<div style="text-align:center; padding:20px;"><h3>Pesanan Dikirim!</h3><p>Admin sedang memproses pesanan Anda.</p><div id="dl-box" style="font-size:1.5rem; margin-top:20px;">⏳</div></div>';
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){ clearInterval(cek); document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block;background:var(--d);color:white;padding:15px;border-radius:14px;text-decoration:none;font-weight:bold;margin-top:15px;">DOWNLOAD PDF</a>\`; }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (RESIZEABLE & STABLE) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; margin:0; height:100dvh; display:flex; align-items:center; justify-content:center; position:fixed; width:100%; overflow:hidden; touch-action:none;">
    <form action="/login" method="POST" style="background:white; padding:40px 30px; border-radius:30px; width:90%; max-width:360px; text-align:center; box-sizing:border-box;">
        <h2 style="margin:0 0 10px 0; font-family:sans-serif; color:#0f172a;">ADMIN LOGIN</h2>
        <p style="color:#64748b; font-size:0.85rem; margin-bottom:30px;">Silakan masukkan passcode anda</p>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:18px; border:2px solid #f1f5f9; border-radius:15px; text-align:center; font-size:1.2rem; box-sizing:border-box; outline:none; background:#f8fafc;">
        <button style="width:100%; padding:18px; background:#38bdf8; color:white; border:none; border-radius:15px; font-weight:800; margin-top:25px; font-size:1rem; cursor:pointer;">MASUK SEKARANG</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (FULL UX) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body{font-family:sans-serif; background:#f1f5f9; padding:15px; margin:0;}
        .card{background:white; padding:20px; border-radius:22px; margin-bottom:20px; box-shadow:0 4px 10px rgba(0,0,0,0.03);}
        input, select{width:100%; padding:15px; margin:10px 0; border:1px solid #e2e8f0; border-radius:14px; box-sizing:border-box; outline:none;}
        .btn-acc{background:#10b981; color:white; border:none; padding:15px; border-radius:12px; width:100%; font-weight:800; cursor:pointer; margin-top:10px;}
        .btn-del{background:none; border:none; color:#ef4444; font-weight:800; cursor:pointer;}
        h3{margin-top:0; font-size:1.1rem; color:#0f172a;}
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2 style="margin:0;">JESTRI PANEL</h2>
        <a href="/" style="text-decoration:none; color:#38bdf8; font-weight:bold;">Lihat Toko</a>
    </div>

    <div class="card">
        <h3>Posting Buku Baru</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Penulis">
        <input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(x=>`<option>${x}</option>`).join('')}</select>
        <div style="font-size:0.75rem; color:#94a3b8; margin:5px 0;">Cover Gambar:</div>
        <input type="file" id="fi" accept="image/*">
        <button onclick="addB()" id="btnS" style="width:100%; padding:16px; background:#0f172a; color:white; border:none; border-radius:15px; font-weight:bold; margin-top:15px;">POSTING SEKARANG</button>
    </div>

    <h3>Pesanan Baru (\${o.length})</h3>
    ${o.map(x => `<div class="card" style="border-left:6px solid #fbbf24;">
        <div style="font-weight:800; font-size:1rem;">\${x.wallet} - Rp \${new Intl.NumberFormat('id-ID').format(x.total)}</div>
        <a href="\${x.bukti}" target="_blank" style="color:#38bdf8; display:inline-block; margin:10px 0; font-size:0.9rem;">Cek Bukti Pembayaran <i class="fa-solid fa-up-right-from-square"></i></a>
        <div style="font-size:0.75rem; color:#64748b;">Kirim File PDF:</div>
        <input type="file" id="pdf-\${x._id}" accept=".pdf">
        <button onclick="acc('\${x._id}')" class="btn-acc">SETUJUI & KIRIM PDF</button>
        <button onclick="delO('\${x._id}')" style="width:100%; border:none; background:none; color:#ef4444; margin-top:15px; font-size:0.85rem; font-weight:bold;">TOLAK PESANAN</button>
    </div>`).join('')}

    <h3>Katalog Buku</h3>
    <div class="card">
        ${b.map(x => `<div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f1f5f9;">
            <div><div style="font-weight:bold;">${x.judul}</div><div style="font-size:0.75rem; color:#64748b;">${x.penulis}</div></div>
            <button onclick="delB('${x._id}')" class="btn-del"><i class="fa-solid fa-trash"></i></button>
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
        async function delB(id){ if(confirm('Hapus?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
        async function delO(id){ if(confirm('Tolak?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-buku/:id', async (req
