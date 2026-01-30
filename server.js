const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieSession({ name: 'jestri_v20', keys: ['JESTRI_COLOR_ULTRA'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. UI PEMBELI (WARNA TEGAS & KOLOM PENULIS) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JESTRI STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        :root { 
            --merah-gelap: #7f1d1d; --biru-terang: #0ea5e9; --hijau-gelap: #064e3b; 
            --hitam-terang: #1e293b; --putih-terang: #f8fafc; --ungu-gelap: #4c1d95; 
        }
        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: var(--putih-terang); color: var(--hitam-terang); }

        /* Header Biru Terang */
        header { background: var(--biru-terang); padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        
        /* Sidebar Hitam Terang */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: var(--hitam-terang); z-index: 5000; transition: 0.3s; padding: 25px; color: white; }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 4500; display: none; }
        .nav-item { padding: 12px 15px; margin-bottom: 8px; border-radius: 10px; cursor: pointer; color: white; border: 1px solid rgba(255,255,255,0.1); }
        .nav-item.active { background: var(--biru-terang); border: none; }
        .btn-donate { background: var(--ungu-gelap); padding: 15px; border-radius: 12px; text-align: center; color: white; text-decoration: none; display: block; margin-top: 20px; font-weight: 800; }

        /* Grid Katalog */
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 15px; }
        .card { background: white; border-radius: 12px; overflow: hidden; border: 2px solid #e2e8f0; display: flex; flex-direction: column; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-body { padding: 10px; }
        .judul { font-weight: 800; font-size: 0.85rem; height: 2.5em; overflow: hidden; margin-bottom: 2px; }
        .penulis { font-size: 0.7rem; color: #64748b; margin-bottom: 8px; font-weight: 600; }
        .harga { color: var(--hijau-gelap); font-weight: 800; font-size: 0.9rem; margin-bottom: 10px; }
        .btn-buy { width: 100%; padding: 10px; background: var(--biru-terang); color: white; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; }

        /* Sosmed Ungu Gelap */
        .sosmed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 4000; }
        .btn-sos { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.5rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .wa { background: #16a34a; } .ig { background: var(--ungu-gelap); }

        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: none; align-items: center; justify-content: center; padding: 20px; }
        .m-box { background: white; width: 100%; max-width: 380px; border-radius: 20px; padding: 25px; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <aside class="sidebar" id="sb">
        <h2 style="color:var(--biru-terang);">GENRE</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" class="btn-donate">DONASI ADMIN</a>
    </aside>
    <header>
        <i class="fa-solid fa-bars" onclick="tog()" style="font-size:1.5rem; cursor:pointer;"></i>
        <div style="font-weight:900;">JESTRI STORE</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;"><i class="fa-solid fa-cart-shopping"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:var(--merah-gelap); padding:2px 6px; border-radius:50%; font-size:0.6rem;">0</span></div>
    </header>
    <main class="grid" id="mainGrid"></main>
    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="btn-sos wa"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="btn-sos ig"><i class="fa-brands fa-instagram"></i></a>
    </div>
    <div id="modal"><div class="m-box" id="mContent"></div></div>
    <script>
        let allB = [], cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ const r = await fetch('/api/buku-json'); allB = await r.json(); render(allB); }
        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}">
                    <div class="card-body">
                        <div class="judul">\${x.judul}</div>
                        <div class="penulis">Oleh: \${x.penulis || 'Anonim'}</div>
                        <div class="harga">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">AMBIL</button>
                    </div>
                </div>\`).join('');
        }
        function setG(g, el){ document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); el.classList.add('active'); render(g === 'Semua' ? allB : allB.filter(b => b.genre === g)); tog(); }
        function add(id){ const b = allB.find(x => x._id === id); if(!cart.find(x => x._id === id)) cart.push(b); document.getElementById('cc').innerText = cart.length; }
        function openCart(){
            if(!cart.length) return alert("Keranjang Kosong!");
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`<h3>Checkout</h3>\${cart.map(x=>\`<div style="font-size:0.8rem;">• \${x.judul}</div>\`).join('')}<p>Total: <b style="color:var(--hijau-gelap);">Rp \${cart.reduce((a,b)=>a+b.harga,0).toLocaleString()}</b></p><input type="file" id="fBukti" style="margin:10px 0;"><button onclick="checkout()" id="btnC" style="width:100%; padding:15px; background:var(--hijau-gelap); color:white; border:none; border-radius:10px; font-weight:800;">BAYAR SEKARANG</button><button onclick="location.reload()" style="width:100%; background:none; border:none; color:var(--merah-gelap); margin-top:10px; font-weight:bold;">BATAL</button>\`;
        }
        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Pilih bukti!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url }) });
            const data = await res.json();
            document.getElementById('mContent').innerHTML = "<h3>Sukses!</h3><p>Tunggu verifikasi admin...</p><div id='dl' style='font-size:2rem; text-align:center;'>⌛</div>";
            setInterval(async () => { const rs = await fetch('/api/check/'+data.id); const st = await rs.json(); if(st.status === 'Approved') document.getElementById('dl').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block; background:var(--biru-terang); color:white; padding:15px; text-align:center; border-radius:10px; text-decoration:none; font-weight:bold; margin-top:15px;">DOWNLOAD PDF</a>\`; }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (MERAH GELAP & BIRU TERANG) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:var(--hitam-terang); display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif;">
    <form action="/login" method="POST" style="background:white; padding:40px; border-radius:20px; width:340px; text-align:center; border-top:8px solid var(--biru-terang);">
        <h2 style="color:var(--hitam-terang);">ADMIN ACCESS</h2>
        <input name="pw" type="password" placeholder="Passcode" style="width:100%; padding:15px; margin:20px 0; border:2px solid #ddd; border-radius:10px; text-align:center; font-size:1.2rem;">
        <button style="width:100%; padding:15px; background:var(--biru-terang); color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">LOGIN</button>
    </form></body>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (PRESISI & WARNA TERPISAH) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    const listO = o.map(x => `
        <div style="background:white; padding:15px; border-radius:15px; margin-bottom:12px; border:2px solid #e2e8f0; border-left:8px solid var(--biru-terang);">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><b style="color:var(--hijau-gelap);">Rp ${x.total.toLocaleString()}</b> <a href="${x.bukti}" target="_blank" style="color:var(--biru-terang); font-size:0.8rem; font-weight:700;">BUKTI TF</a></div>
            <input type="file" id="pdf-${x._id}" style="font-size:0.7rem; width:100%; margin-bottom:8px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                <button onclick="acc('${x._id}')" style="padding:10px; background:var(--hijau-gelap); color:white; border:none; border-radius:8px; font-weight:bold;">SETUJU</button>
                <button onclick="delO('${x._id}')" style="padding:10px; background:var(--merah-gelap); color:white; border:none; border-radius:8px; font-weight:bold;">TOLAK</button>
            </div>
        </div>`).join('');

    const listB = b.map(x => `
        <div style="display:flex; align-items:center; gap:10px; padding:10px; background:white; border-bottom:2px solid #f1f5f9;">
            <img src="${x.gambar}" style="width:35px; height:45px; object-fit:cover; border-radius:4px;">
            <div style="flex-grow:1;"><div style="font-weight:700; font-size:0.8rem;">${x.judul}</div><div style="font-size:0.65rem; color:gray;">${x.penulis}</div></div>
            <button onclick="delB('${x._id}')" style="color:var(--merah-gelap); border:none; background:none; font-size:1.2rem;"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family:sans-serif; background:#f1f5f9; margin:0; padding:20px; }
        .box { background:white; padding:20px; border-radius:18px; border:2px solid #e2e8f0; margin-bottom:20px; }
        input, select { width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px; }
        h3 { border-bottom:4px solid var(--biru-terang); display:inline-block; padding-bottom:5px; font-size:1.1rem; }
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center;"><h2>Panel Admin</h2><a href="/" style="color:var(--biru-terang); text-decoration:none;">Toko <i class="fa-solid fa-external-link"></i></a></div>
    <div class="box">
        <h3><i class="fa-solid fa-plus-circle"></i> Posting Buku</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Nama Penulis">
        <input id="h" type="number" placeholder="Harga">
        <select id="g">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" style="width:100%; padding:15px; background:var(--biru-terang); color:white; border:none; border-radius:10px; font-weight:800; font-size:1rem; cursor:pointer;">POSTING BUKU</button>
    </div>
    <h3>Order Pending (${o.length})</h3>
    <div>${listO || '<p style="color:gray;">Kosong</p>'}</div>
    <h3>Katalog Produk (${b.length})</h3>
    <div class="box" style="padding:0;">${listB}</div>
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "Processing..."; btn.disabled = true;
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
        async function delO(id){ if(confirm('Tolak?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        async function delB(id){ if(confirm('Hapus?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

