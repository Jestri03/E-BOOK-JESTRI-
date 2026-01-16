const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI);

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const Order = mongoose.model('Order', { 
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String, pdfLink: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_vFinal_Real', keys: ['JESTRI_PRIVATE_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (OPTIMAL) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #f8fafc; color: #1e293b; overflow-x: hidden; }
        
        .header { position: sticky; top: 0; background: #0f172a; color: white; z-index: 1000; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .logo { font-weight: 800; font-size: 1.1rem; color: #38bdf8; }

        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #ffffff; z-index: 5000; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 25px; border-radius: 0 25px 25px 0; }
        .sidebar.active { left: 0; box-shadow: 10px 0 50px rgba(0,0,0,0.2); }
        .nav-item { padding: 15px; border-radius: 12px; margin-bottom: 8px; cursor: pointer; color: #64748b; font-weight: 600; }
        .nav-item.active { background: #38bdf8; color: white; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; }
        .card { background: white; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: 0.3s; }
        .card:active { transform: scale(0.97); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f1f5f9; }
        .card-body { padding: 12px; }
        .card-price { color: #10b981; font-weight: 800; font-size: 1rem; margin: 6px 0; }
        .btn-buy { width: 100%; padding: 12px; border: none; border-radius: 10px; background: #0f172a; color: white; font-weight: 800; font-size: 0.75rem; cursor: pointer; }

        .sosmed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 4000; }
        .sos-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2); text-decoration: none; }

        #toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #0f172a; color: white; padding: 12px 25px; border-radius: 50px; font-weight: bold; display: none; z-index: 10000; animation: slideUp 0.3s; }
        @keyframes slideUp { from { transform: translate(-50%, 50px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 4500; display: none; backdrop-filter: blur(4px); }
    </style></head><body>

    <div id="toast">Berhasil ditambahkan!</div>
    <div class="overlay" id="ov" onclick="tog()"></div>

    <div class="sidebar" id="sb">
        <h2 style="color:#0f172a; margin-bottom:25px;">Kategori</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://wa.me/6285189415489" style="display:block; margin-top:30px; background:#fbbf24; color:black; padding:15px; border-radius:12px; text-align:center; font-weight:bold; text-decoration:none;">BANTUAN</a>
    </div>

    <div class="header">
        <i class="fa-solid fa-align-left" onclick="tog()" style="font-size:1.3rem;"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;"><i class="fa-solid fa-basket-shopping" style="font-size:1.3rem;"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:#ef4444; color:white; font-size:0.6rem; padding:2px 6px; border-radius:50%;">0</span></div>
    </div>

    <div style="padding:15px; background:#0f172a;">
        <input type="text" id="sr" placeholder="Cari judul buku..." oninput="cari()" style="width:100%; padding:14px; border-radius:12px; border:none; outline:none; background:#1e293b; color:white;">
    </div>

    <div id="mainGrid" class="grid"></div>

    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="sos-btn" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="sos-btn" style="background:#e1306c;"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:none; align-items:center; justify-content:center; padding:20px;">
        <div style="background:white; width:100%; max-width:380px; border-radius:24px; padding:25px;">
            <h3 style="margin-top:0;">Keranjang Saya</h3>
            <div id="cItems" style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px;"></div>
            <p style="font-weight:800;">Total: <span id="cTotal" style="color:#10b981;">Rp 0</span></p>
            <select id="wlt" style="width:100%; padding:12px; margin:15px 0; border-radius:10px; border:1px solid #ddd;">
                <option value="DANA">DANA (0895327806441)</option>
                <option value="OVO">OVO (0895327806441)</option>
                <option value="GOPAY">GOPAY (0895327806441)</option>
            </select>
            <input type="file" id="fBukti" style="font-size:0.8rem; margin-bottom:20px;">
            <button onclick="checkout()" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:12px; font-weight:bold;">BAYAR SEKARANG</button>
            <button onclick="location.reload()" style="width:100%; background:none; border:none; margin-top:15px; color:#94a3b8;">Tutup</button>
        </div>
    </div>

    <script>
        let allB = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ 
            const r = await fetch('/api/buku-json?v=' + Date.now()); 
            allB = await r.json(); 
            render(allB); 
        }

        function render(data){
            const g = document.getElementById('mainGrid');
            if(data.length === 0) { g.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:50px;">Buku tidak tersedia.</p>'; return; }
            g.innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/400x600?text=EBOOK+JESTRI'">
                    <div class="card-body">
                        <div style="font-size:0.8rem; font-weight:800; height:2.5em; overflow:hidden;">\${x.judul}</div>
                        <div class="card-price">Rp \${new Intl.NumberFormat('id-ID').format(x.harga)}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">AMBIL BUKU</button>
                    </div>
                </div>\`).join('');
        }

        function cari(){
            const k = document.getElementById('sr').value.toLowerCase();
            render(allB.filter(b => b.judul.toLowerCase().includes(k)));
        }

        function setG(g, el){
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g));
            if(window.innerWidth < 1000) tog();
        }

        function add(id){
            if(cart.some(i => i._id === id)) return;
            cart.push(allB.find(x => x._id === id));
            document.getElementById('cc').innerText = cart.length;
            const t = document.getElementById('toast'); t.style.display='block';
            setTimeout(() => t.style.display='none', 2000);
        }

        function openCart(){
            if(cart.length === 0) return alert("Keranjang kosong!");
            document.getElementById('cItems').innerHTML = cart.map((x,i)=>\`<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">\${x.judul} <i class="fa-solid fa-trash" onclick="cart.splice(\${i},1);openCart();" style="color:#ef4444"></i></div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Upload bukti bayar!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url, wallet: document.getElementById('wlt').value })
            });
            const order = await res.json();
            document.getElementById('modal').innerHTML = '<div style="text-align:center; padding:20px;"><h3>Berhasil!</h3><p>Pesanan Anda sedang diverifikasi admin.</p><div id="dl-box">⏳</div></div>';
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){
                    clearInterval(cek);
                    document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink.replace('/upload/','/upload/fl_attachment/')}" download style="display:block; background:#0f172a; color:white; padding:15px; border-radius:12px; text-decoration:none; font-weight:800; margin-top:15px;">DOWNLOAD PDF</a>\`;
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (ANTI-GESER) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; margin:0; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; overflow:hidden; touch-action:none;">
    <form action="/login" method="POST" style="background:white; padding:40px; border-radius:24px; width:300px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.5);">
        <h2 style="margin-bottom:20px;">Admin Access</h2>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:15px; border:1px solid #ddd; border-radius:12px; margin-bottom:20px; text-align:center; font-size:1.1rem;">
        <button style="width:100%; padding:15px; background:#38bdf8; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">MASUK</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (HAPUS FIX) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body{font-family:sans-serif; background:#f1f5f9; padding:20px;}
        .box{background:white; padding:20px; border-radius:15px; margin-bottom:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05);}
        input, select{width:100%; padding:12px; margin:8px 0; border:1px solid #ddd; border-radius:10px; box-sizing:border-box;}
        .btn-post{width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;}
        .item-row{display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #eee;}
    </style></head><body>
    <h2>DASHBOARD ADMIN</h2>
    <div class="box">
        <h3>Input Buku Baru</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Penulis">
        <input id="h" type="number" placeholder="Harga (Contoh: 2800)">
        <select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" class="btn-post">POSTING SEKARANG</button>
    </div>
    <h3>Katalog Buku</h3>
    <div class="box">
        ${b.map(x=>`<div class="item-row">
            <span>\${x.judul}</span>
            <button onclick="hapusB('\${x._id}')" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-trash-can"></i> HAPUS</button>
        </div>`).join('')}
    </div>
    <script>
        async function addB(){
            const fi=document.getElementById('fi').files[0]; if(!fi) return alert("Pilih cover!");
            const fdI=new FormData(); fdI.append('file',fi); fdI.append('upload_preset','ml_default');
            const dI=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fdI})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:dI.secure_url})});
            location.reload();
        }
        async function hapusB(id){
            if(confirm('Hapus buku ini secara permanen?')){
                const r = await fetch('/admin/hapus-buku/' + id, { method: 'DELETE' });
                const res = await r.json();
                if(res.ok) location.reload();
            }
        }
        async function acc(id){
            const f=document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih PDF!");
            const fd=new FormData(); fd.append('file',f); fd.append('upload_preset','ml_default');
            const up=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
    </script></body></html>`);
});

// --- RUTE API & KONTROL ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });

// RUTE HAPUS BUKU FIX
app.delete('/admin/hapus-buku/:id', async (req, res) => {
    if(req.session.admin) {
        await Buku.findByIdAndDelete(req.params.id);
        res.json({ok:true});
    } else {
        res.status(403).json({ok:false});
    }
});

app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

