const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- KONEKSI DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("DB Connected"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const Order = mongoose.model('Order', { 
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String, pdfLink: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_vFinal', keys: ['SECRET_KEY_JESTRI'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (MODERN & BERSIH) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: #f8fafc; color: #0f172a; overflow-x: hidden; }
        
        .header { position: sticky; top: 0; background: #0f172a; color: white; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .logo { font-weight: 800; font-size: 1.2rem; color: #38bdf8; }

        .search-area { background: #0f172a; padding: 10px 20px 20px; }
        .search-input { width: 100%; padding: 12px 18px; border-radius: 12px; border: none; background: #1e293b; color: white; outline: none; }

        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #ffffff; z-index: 5000; transition: 0.4s; padding: 30px 20px; box-shadow: 5px 0 30px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .nav-item { padding: 14px; margin-bottom: 8px; border-radius: 10px; cursor: pointer; color: #64748b; font-weight: 600; transition: 0.3s; }
        .nav-item.active { background: #38bdf8; color: white; }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 20px; }
        .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #e2e8f0; }
        .card-body { padding: 12px; flex-grow: 1; }
        .card-title { font-size: 0.85rem; font-weight: 800; height: 2.5em; overflow: hidden; line-height: 1.3; }
        .card-price { color: #059669; font-weight: 800; font-size: 1rem; margin: 8px 0; }
        .btn-buy { width: 100%; padding: 10px; background: #0f172a; color: white; border: none; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer; }

        .sosmed-box { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 4000; }
        .sos-btn { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.2rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }

        #toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #38bdf8; color: white; padding: 12px 24px; border-radius: 50px; font-weight: 800; display: none; z-index: 10000; box-shadow: 0 10px 25px rgba(56,189,248,0.4); }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 4500; display: none; backdrop-filter: blur(4px); }
        
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .modal-content { background: white; width: 100%; max-width: 380px; border-radius: 24px; padding: 25px; }
    </style></head><body>

    <div id="toast">Berhasil ditambahkan!</div>
    <div class="overlay" id="ov" onclick="tog()"></div>

    <div class="sidebar" id="sb">
        <h2 style="margin-bottom:20px; color:#0f172a;">Menu</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <hr style="margin:20px 0; opacity:0.1;">
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; background:#fbbf24; color:black; text-align:center; padding:12px; border-radius:10px; text-decoration:none; font-weight:800;">DONASI ADMIN</a>
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.3rem;"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative;"><i class="fa-solid fa-cart-shopping" style="font-size:1.2rem;"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:#ef4444; color:white; font-size:0.6rem; padding:2px 6px; border-radius:50%;">0</span></div>
    </div>

    <div class="search-area">
        <input type="text" id="sr" class="search-input" placeholder="Cari judul buku atau penulis..." oninput="cari()">
    </div>

    <div id="mainGrid" class="grid"></div>

    <div class="sosmed-box">
        <a href="https://wa.me/6285189415489" class="sos-btn" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="sos-btn" style="background:linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal"><div class="modal-content">
        <h3 style="margin-bottom:15px;">Checkout</h3>
        <div id="cItems" style="margin-bottom:15px; font-size:0.85rem; max-height:150px; overflow-y:auto;"></div>
        <p style="font-weight:800; border-top:1px solid #eee; padding-top:10px;">Total: <span id="cTotal" style="color:#059669;">Rp 0</span></p>
        <select id="wlt" style="width:100%; padding:12px; margin:15px 0; border-radius:10px; border:1px solid #ddd;">
            <option value="DANA">DANA (0895327806441)</option>
            <option value="OVO">OVO (0895327806441)</option>
            <option value="GOPAY">GOPAY (0895327806441)</option>
        </select>
        <input type="file" id="fBukti" style="margin-bottom:20px; font-size:0.8rem;">
        <button onclick="checkout()" style="width:100%; padding:15px; background:#059669; color:white; border:none; border-radius:12px; font-weight:800; cursor:pointer;">KONFIRMASI PEMBAYARAN</button>
        <button onclick="location.reload()" style="width:100%; border:none; background:none; color:#94a3b8; margin-top:15px;">Tutup</button>
    </div></div>

    <script>
        let allB = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ 
            const r = await fetch('/api/buku-json?v=' + Date.now(), { cache: 'no-store' }); 
            allB = await r.json(); 
            render(allB); 
        }

        function render(data){
            const g = document.getElementById('mainGrid');
            if(data.length === 0) { g.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.5;">Belum ada buku.</p>'; return; }
            g.innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/400x600/e2e8f0/64748b?text=E-BOOK+JESTRI'">
                    <div class="card-body">
                        <div class="card-title">\${x.judul}</div>
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
            if(window.innerWidth < 1000) tog();
        }

        function add(id){
            if(cart.some(i => i._id === id)) return;
            cart.push(allB.find(x => x._id === id));
            document.getElementById('cc').innerText = cart.length;
            const t = document.getElementById('toast'); t.style.display = 'block';
            setTimeout(() => t.style.display = 'none', 2000);
        }

        function openCart(){
            if(cart.length === 0) return alert("Keranjang kosong!");
            document.getElementById('cItems').innerHTML = cart.map((x,i)=>\`<div style="display:flex; justify-content:space-between; margin-bottom:8px;">\${x.judul} <i class="fa-solid fa-trash" onclick="cart.splice(\${i},1);openCart();" style="color:#ef4444"></i></div>\`).join('');
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
            document.querySelector('.modal-content').innerHTML = '<div style="text-align:center;"><h3>Berhasil!</h3><p>Pesanan sedang diproses admin.</p><div id="dl-box" style="margin-top:20px;">⏳</div></div>';
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){
                    clearInterval(cek);
                    document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink.replace('/upload/','/upload/fl_attachment/')}" download style="display:block; background:#0f172a; color:white; padding:15px; border-radius:12px; text-decoration:none; font-weight:800;">DOWNLOAD PDF</a>\`;
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (STABIL & KOKOH) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; margin:0; display:flex; align-items:center; justify-content:center; height:100dvh; font-family:sans-serif;">
    <form action="/login" method="POST" style="background:white; padding:40px; border-radius:24px; width:320px; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.3);">
        <h2 style="margin:0 0 20px 0; color:#0f172a;">Admin Login</h2>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:15px; border:1px solid #ddd; border-radius:12px; margin-bottom:20px; text-align:center; font-size:1rem;">
        <button style="width:100%; padding:15px; background:#38bdf8; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">LOGIN</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (FITUR HAPUS FIX) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body{font-family:sans-serif; background:#f1f5f9; padding:20px;}
        .card{background:white; padding:20px; border-radius:15px; margin-bottom:20px; box-shadow:0 2px 5px rgba(0,0,0,0.05);}
        input, select{width:100%; padding:12px; margin:5px 0; border:1px solid #ddd; border-radius:10px; box-sizing:border-box;}
        .btn-del{color:#ef4444; border:none; background:none; cursor:pointer; font-weight:bold;}
    </style></head><body>
    <h2>DASHBOARD JESTRI</h2>
    <div class="card">
        <h3>Tambah Buku Baru</h3>
        <input id="j" placeholder="Judul Buku"><input id="p" placeholder="Penulis">
        <input id="h" type="number" placeholder="Harga (Contoh: 2800)">
        <select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" style="width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:10px; margin-top:10px; font-weight:bold;">PUBLISH</button>
    </div>
    <h3>Pesanan Masuk (${o.length})</h3>
    ${o.map(x=>`<div class="card"><b>Rp \${new Intl.NumberFormat('id-ID').format(x.total)}</b><br><a href="\${x.bukti}" target="_blank">Cek Bukti</a><br>
        <input type="file" id="pdf-\${x._id}" style="margin-top:10px;">
        <button onclick="acc('\${x._id}')" style="background:#10b981; color:white; border:none; padding:10px; width:100%; border-radius:8px; margin-top:10px; font-weight:bold;">APPROVE & KIRIM PDF</button>
    </div>`).join('')}
    <h3>Katalog Koleksi</h3>
    ${b.map(x=>`<div class="card" style="display:flex; justify-content:space-between; align-items:center;">
        <span>\${x.judul}</span>
        <button onclick="delB('\${x._id}')" class="btn-del">HAPUS</button>
    </div>`).join('')}
    <script>
        async function addB(){
            const fi=document.getElementById('fi').files[0]; if(!fi) return alert("Pilih cover!");
            const fdI=new FormData(); fdI.append('file',fi); fdI.append('upload_preset','ml_default');
            const dI=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fdI})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:dI.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f=document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih PDF!");
            const fd=new FormData(); fd.append('file',f); fd.append('upload_preset','ml_default');
            const up=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delB(id){
            if(confirm('Hapus buku ini?')){
                await fetch('/admin/delete/'+id, { method: 'DELETE' });
                location.reload();
            }
        }
    </script></body></html>`);
});

// --- 4. SEMUA RUTE API (OPTIMAL) ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.delete('/admin/delete/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const data = await Buku.find().sort({_id:-1});
    res.json(data);
});
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

