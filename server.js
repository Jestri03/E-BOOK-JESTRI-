const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
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
app.use(cookieSession({ name: 'jestri_ultimate', keys: ['JESTRI_MASTER_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: #f8fafc; color: #1e293b; overflow-x: hidden; }
        
        .top-nav { background: #0f172a; color: white; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top:0; z-index:1000; }
        .logo { font-weight: 800; color: #38bdf8; font-size: 1.2rem; }
        
        .search-area { background: #0f172a; padding: 0 20px 15px 20px; }
        .search-input { width: 100%; padding: 12px; border-radius: 12px; border: none; background: #1e293b; color: white; outline: none; }

        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.3s; padding: 25px; }
        .sidebar.active { left: 0; box-shadow: 10px 0 50px rgba(0,0,0,0.3); }
        .nav-head { font-size: 0.8rem; font-weight: 800; color: #38bdf8; margin: 25px 0 10px 5px; text-transform: uppercase; }
        .nav-item { padding: 12px 15px; border-radius: 10px; margin-bottom: 4px; cursor: pointer; color: #475569; font-weight: 600; }
        .nav-item.active { background: #38bdf8; color: white; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px; }
        .card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f1f5f9; }
        .card-body { padding: 12px; flex-grow: 1; }
        .card-price { color: #10b981; font-weight: 800; font-size: 1rem; margin: 5px 0; }
        .btn-buy { width: 100%; padding: 10px; border: none; border-radius: 10px; background: #0f172a; color: white; font-weight: 800; font-size: 0.75rem; cursor: pointer; }

        .empty-state { grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; }

        .float-box { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 4000; }
        .float-btn { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.6rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .modal-box { background: white; width: 100%; max-width: 380px; border-radius: 24px; padding: 25px; max-height: 90vh; overflow-y: auto; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 4500; display: none; backdrop-filter: blur(3px); }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>

    <div class="sidebar" id="sb">
        <h2 style="color:#0f172a; margin:0;">JESTRI MENU</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        <div class="nav-head">GENRE</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; margin-top:30px; background:#fbbf24; color:black; padding:14px; border-radius:12px; text-align:center; text-decoration:none; font-weight:800;">DONASI ADMIN</a>
    </div>

    <div class="top-nav">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem;"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;"><i class="fa-solid fa-cart-shopping" style="font-size:1.4rem;"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:#ef4444; color:white; font-size:0.65rem; padding:2px 6px; border-radius:50%; font-weight:800;">0</span></div>
    </div>

    <div class="search-area"><input type="text" id="sr" class="search-input" placeholder="Cari e-book..." oninput="cari()"></div>

    <div id="mainGrid" class="grid"></div>

    <div class="float-box">
        <a href="https://wa.me/6285189415489" class="float-btn" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="float-btn" style="background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal"><div class="modal-box">
        <h3 style="margin-top:0;">Checkout</h3>
        <div id="cItems" style="margin-bottom:15px; font-size:0.85rem;"></div>
        <p><b>Total: </b><span id="cTotal" style="color:#10b981;"></span></p>
        
        <label style="font-size:0.8rem; font-weight:800;">METODE PEMBAYARAN:</label>
        <select id="wlt" style="width:100%; padding:12px; margin:10px 0; border-radius:12px; border:1px solid #ddd;">
            <option value="DANA">DANA (0895327806441)</option>
            <option value="OVO">OVO (0895327806441)</option>
            <option value="GOPAY">GOPAY (0895327806441)</option>
        </select>

        <label style="font-size:0.8rem; font-weight:800;">UPLOAD BUKTI TF:</label>
        <input type="file" id="fBukti" style="margin:10px 0; width:100%;">
        
        <button onclick="checkout()" id="btnC" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:12px; font-weight:800; margin-top:10px;">KIRIM PESANAN</button>
        <button onclick="location.reload()" style="width:100%; border:none; background:none; color:gray; margin-top:10px; font-weight:600;">Batal</button>
    </div></div>

    <script>
        let allB = []; let cart = []; let curG = 'Semua';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ const r = await fetch('/api/buku-json?v='+Date.now()); allB = await r.json(); render(allB); }

        function render(data){
            const g = document.getElementById('mainGrid');
            if(data.length === 0){
                g.innerHTML = \`<div class="empty-state">Buku dengan genre \${curG} belum ada</div>\`;
                return;
            }
            g.innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/400x600?text=JESTRI'">
                    <div class="card-body">
                        <div style="font-size:0.8rem; font-weight:800; height:2.5em; overflow:hidden;">\${x.judul}</div>
                        <div style="font-size:0.65rem; color:#64748b; margin:4px 0;">\${x.penulis}</div>
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
            document.getElementById('cItems').innerHTML = cart.map(x => \`<div>• \${x.judul}</div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Harap upload bukti!");
            const btn = document.getElementById('btnC'); btn.disabled = true; btn.innerText = "Mengirim...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url, wallet: document.getElementById('wlt').value })
            });
            const order = await res.json();
            document.getElementById('modal').innerHTML = '<div style="text-align:center;"><h3>Berhasil!</h3><p>Pesanan Anda sedang diproses admin.</p><div id="dl-box">⏳ Menunggu Verifikasi...</div></div>';
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){ clearInterval(cek); document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block;background:#0f172a;color:white;padding:15px;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:15px;">DOWNLOAD PDF</a>\`; }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (FIX SIZE & STABLE) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; margin:0; height:100dvh; display:flex; align-items:center; justify-content:center; position:fixed; width:100%; overflow:hidden; touch-action:none;">
    <form action="/login" method="POST" style="background:white; padding:40px 30px; border-radius:24px; width:90%; max-width:350px; text-align:center; font-family:sans-serif; box-sizing:border-box;">
        <h2 style="margin:0 0 20px 0; color:#0f172a;">JESTRI ADMIN</h2>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:15px; border:1px solid #ddd; border-radius:12px; text-align:center; font-size:1.1rem; box-sizing:border-box; outline:none;">
        <button style="width:100%; padding:15px; background:#38bdf8; color:white; border:none; border-radius:12px; font-weight:bold; margin-top:20px; font-size:1.1rem; cursor:pointer;">MASUK</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (LENGKAP: SETUJU/TOLAK/BUKTI) ---
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
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h2 style="margin:0;">ADMIN PANEL</h2>
        <a href="/" style="text-decoration:none; color:#38bdf8; font-weight:bold;">Lihat Toko</a>
    </div>

    <div class="box">
        <h3>Input Buku Baru</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Penulis">
        <input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(x=>`<option>${x}</option>`).join('')}</select>
        <input type="file" id="fi" accept="image/*">
        <button onclick="addB()" id="btnS" style="width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:bold;">POSTING BUKU</button>
    </div>

    <h3>Pesanan Menunggu (${o.length})</h3>
    ${o.map(x => `<div class="box" style="border-left:5px solid #fbbf24;">
        <div style="font-weight:800;">\${x.wallet} - Rp \${new Intl.NumberFormat('id-ID').format(x.total)}</div>
        <a href="\${x.bukti}" target="_blank" style="color:#38bdf8; display:inline-block; margin:8px 0;">Lihat Bukti Transfer <i class="fa-solid fa-image"></i></a>
        <div style="font-size:0.8rem; color:gray; margin-bottom:5px;">Upload File PDF E-book:</div>
        <input type="file" id="pdf-\${x._id}" accept=".pdf">
        <button onclick="acc('\${x._id}')" class="btn-acc">SETUJUI & KIRIM PDF</button>
        <button onclick="delO('\${x._id}')" style="width:100%; border:none; background:none; color:#ef4444; margin-top:10px; font-size:0.8rem; font-weight:bold;">TOLAK PESANAN</button>
    </div>`).join('')}

    <h3>Katalog Koleksi</h3>
    <div class="box">
        ${b.map(x => `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;">
            <div><b>${x.judul}</b><br><small>${x.penulis}</small></div>
            <button onclick="delB('${x._id}')" class="btn-del">HAPUS</button>
        </div>`).join('')}
    </div>

    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih foto!");
            const btn = document.getElementById('btnS'); btn.disabled=true; btn.innerText="Uploading...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih PDF dulu!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delB(id){ if(confirm('Hapus buku?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
        async function delO(id){ if(confirm('Tolak pesanan?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

