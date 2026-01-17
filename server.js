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
app.use(cookieSession({ name: 'jestri_secure_session', keys: ['JESTRI_FINAL_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (LAYOUT DIOPTIMALKAN) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: #f8fafc; color: #1e293b; }
        
        /* HEADER BARIS 1 */
        .top-nav { background: #0f172a; color: white; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-weight: 800; color: #38bdf8; font-size: 1.2rem; }
        
        /* HEADER BARIS 2 (PENCARIAN) */
        .search-row { background: #0f172a; padding: 0 20px 15px 20px; }
        .search-bar { width: 100%; padding: 12px 15px; border-radius: 12px; border: none; background: #1e293b; color: white; outline: none; font-size: 0.9rem; }

        /* SIDEBAR MODERN */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 25px; }
        .sidebar.active { left: 0; box-shadow: 10px 0 50px rgba(0,0,0,0.3); }
        .nav-head { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 25px 0 10px 5px; border-bottom: 2px solid #f1f5f9; padding-bottom: 5px; }
        .nav-item { padding: 12px 15px; border-radius: 10px; margin-bottom: 4px; cursor: pointer; color: #475569; font-weight: 600; transition: 0.2s; }
        .nav-item.active { background: #38bdf8; color: white; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px; }
        .card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: 0.2s; }
        .card:active { transform: scale(0.97); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f1f5f9; }
        .card-body { padding: 10px; flex-grow: 1; display: flex; flex-direction: column; }
        .card-price { color: #10b981; font-weight: 800; font-size: 1rem; margin: 5px 0; }
        .btn-buy { width: 100%; padding: 10px; border: none; border-radius: 10px; background: #0f172a; color: white; font-weight: 800; font-size: 0.7rem; cursor: pointer; margin-top: auto; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 4500; display: none; backdrop-filter: blur(3px); }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        
        .float-wa { position: fixed; bottom: 20px; right: 20px; width: 55px; height: 55px; background: #22c55e; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; text-decoration: none; box-shadow: 0 5px 15px rgba(34,197,94,0.4); z-index: 4000; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>

    <div class="sidebar" id="sb">
        <h2 style="color:#0f172a; margin:0;">JESTRI MENU</h2>
        <div class="nav-head">Utama</div>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        
        <div class="nav-head">Kategori Genre</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; margin-top:30px; background:#fbbf24; color:black; padding:12px; border-radius:12px; text-align:center; text-decoration:none; font-weight:800;">DONASI ADMIN</a>
    </div>

    <div class="top-nav">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem;"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;"><i class="fa-solid fa-cart-shopping" style="font-size:1.4rem;"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:#ef4444; color:white; font-size:0.65rem; padding:2px 6px; border-radius:50%; font-weight:800;">0</span></div>
    </div>

    <div class="search-row">
        <input type="text" id="sr" class="search-bar" placeholder="Cari judul buku atau penulis..." oninput="cari()">
    </div>

    <div id="mainGrid" class="grid"></div>

    <a href="https://wa.me/6285189415489" class="float-wa"><i class="fa-brands fa-whatsapp"></i></a>

    <div id="modal"><div style="background:white; width:100%; max-width:380px; border-radius:24px; padding:25px;">
        <h3 style="margin:0 0 15px 0;">Detail Pesanan</h3>
        <div id="cItems" style="font-size:0.9rem; max-height:150px; overflow-y:auto; margin-bottom:15px;"></div>
        <div style="border-top:1px solid #eee; padding-top:10px;">
            <b>Total Bayar: </b><span id="cTotal" style="color:#10b981; font-weight:800;"></span>
        </div>
        <select id="wlt" style="width:100%; padding:12px; margin:15px 0; border-radius:12px; border:1px solid #ddd;">
            <option value="DANA">DANA (0895327806441)</option>
            <option value="OVO">OVO (0895327806441)</option>
            <option value="GOPAY">GOPAY (0895327806441)</option>
        </select>
        <input type="file" id="fBukti" style="margin-bottom:20px; font-size:0.8rem;">
        <button onclick="checkout()" id="btnC" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:12px; font-weight:800;">KONFIRMASI PEMBAYARAN</button>
        <button onclick="location.reload()" style="width:100%; border:none; background:none; color:gray; margin-top:15px; font-weight:600;">Kembali</button>
    </div></div>

    <script>
        let allB = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ const r = await fetch('/api/buku-json?v='+Date.now()); allB = await r.json(); render(allB); }

        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" loading="lazy" onerror="this.src='https://placehold.co/400x600?text=NO+IMAGE'">
                    <div class="card-body">
                        <div style="font-size:0.8rem; font-weight:800; height:2.5em; overflow:hidden; line-height:1.2;">\${x.judul}</div>
                        <div style="font-size:0.65rem; color:#64748b; margin-top:4px;">\${x.penulis}</div>
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
            if(cart.length === 0) return alert("Pilih buku terlebih dahulu!");
            document.getElementById('cItems').innerHTML = cart.map(x => \`<div style="margin-bottom:5px;">• \${x.judul}</div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Harap upload bukti transfer!");
            const btn = document.getElementById('btnC'); btn.disabled = true; btn.innerText = "Mengirim...";
            
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();

            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url, wallet: document.getElementById('wlt').value })
            });
            const order = await res.json();
            document.getElementById('modal').innerHTML = '<div style="background:white;padding:30px;border-radius:24px;text-align:center;"><h3>Berhasil!</h3><p>Admin sedang memproses pesanan Anda.</p><div id="dl-box">⏳</div></div>';
            
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){
                    clearInterval(cek);
                    document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block;background:#0f172a;color:white;padding:15px;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:15px;">DOWNLOAD PDF SEKARANG</a>\`;
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (STATIC & LOCKED) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; margin:0; height:100dvh; display:flex; align-items:center; justify-content:center; position:fixed; width:100%; overflow:hidden; touch-action:none; overscroll-behavior:none;">
    <form action="/login" method="POST" style="background:white; padding:40px; border-radius:24px; width:300px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.5);">
        <h2 style="margin:0 0 20px 0; font-family:sans-serif;">JESTRI LOGIN</h2>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:15px; border:1px solid #ddd; border-radius:12px; text-align:center; font-size:1.1rem; outline:none;">
        <button style="width:100%; padding:15px; background:#38bdf8; color:white; border:none; border-radius:12px; font-weight:bold; margin-top:20px; cursor:pointer;">MASUK ADMIN</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (FIX UPLOAD & MANAGE) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body{font-family:sans-serif; background:#f1f5f9; padding:15px; margin:0;}
        .box{background:white; padding:20px; border-radius:18px; margin-bottom:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05);}
        input, select{width:100%; padding:14px; margin:8px 0; border:1px solid #ddd; border-radius:12px; box-sizing:border-box; outline:none;}
        .btn-main{width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;}
        .item-list{display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9;}
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2>DASHBOARD</h2>
        <a href="/" style="text-decoration:none; color:#38bdf8; font-weight:bold;">Toko <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
    </div>

    <div class="box">
        <h3>Tambah Buku Baru</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Nama Penulis">
        <input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(x=>`<option>${x}</option>`).join('')}</select>
        <div style="font-size:0.8rem; color:gray; margin-top:10px;">Pilih Cover Buku:</div>
        <input type="file" id="fi" accept="image/*">
        <button onclick="addB()" id="btnSave" class="btn-main">SIMPAN KE KATALOG</button>
    </div>

    <h3>Pesanan (${o.length})</h3>
    ${o.map(x => `<div class="box">
        <b>\${x.wallet} - Rp \${new Intl.NumberFormat('id-ID').format(x.total)}</b><br>
        <a href="\${x.bukti}" target="_blank" style="display:inline-block; margin:10px 0; color:#38bdf8;">Klik: Lihat Bukti Transfer</a><br>
        <input type="file" id="pdf-\${x._id}" accept=".pdf">
        <button onclick="acc('\${x._id}')" style="background:#10b981; color:white; border:none; padding:12px; border-radius:10px; width:100%; font-weight:bold; margin-top:5px;">SETUJUI & KIRIM PDF</button>
        <button onclick="delO('\${x._id}')" style="width:100%; background:none; border:none; color:red; margin-top:10px; font-size:0.8rem;">TOLAK PESANAN</button>
    </div>`).join('')}

    <h3>Katalog Koleksi</h3>
    <div class="box" style="padding:10px;">
        ${b.map(x => `<div class="item-list">
            <div>
                <div style="font-weight:bold; font-size:0.9rem;">${x.judul}</div>
                <div style="font-size:0.7rem; color:gray;">${x.penulis}</div>
            </div>
            <button onclick="delB('${x._id}')" style="background:none; border:none; color:#ef4444; font-size:1.1rem; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).join('')}
    </div>

    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Foto cover wajib ada!");
            const btn = document.getElementById('btnSave'); btn.disabled = true; btn.innerText = "Mengunggah...";
            
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const resImg = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const d = await resImg.json();

            if(!d.secure_url) { alert("Gagal upload gambar!"); btn.disabled=false; return; }

            await fetch('/admin/save', { 
                method:'POST', headers:{'Content-Type':'application/json'}, 
                body:JSON.stringify({
                    judul:document.getElementById('j').value, 
                    penulis:document.getElementById('p').value, 
                    harga:Number(document.getElementById('h').value), 
                    genre:document.getElementById('g').value, 
                    gambar:d.secure_url
                }) 
            });
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih file PDF!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload', {method:'POST', body:fd})).json();
            await fetch('/admin/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pdfLink:up.secure_url}) });
            location.reload();
        }
        async function delB(id){ if(confirm('Hapus buku ini?')){ await fetch('/admin/del-buku/'+id, {method:'DELETE'}); location.reload(); } }
        async function delO(id){ if(confirm('Tolak pesanan ini?')){ await fetch('/admin/del-order/'+id, {method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- ROUTES & API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

