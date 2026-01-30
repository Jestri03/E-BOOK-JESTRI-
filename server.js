const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DB CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DATABASE CONNECTED"))
    .catch(e => console.log("❌ DB ERROR:", e));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const Order = mongoose.model('Order', { 
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String, pdfLink: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_final', keys: ['JESTRI_UX'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (FIX GAMBAR) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JESTRI E-BOOK</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; }
        header { background: #0f172a; padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 15px; }
        .card { background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        /* Fix Ukuran Gambar agar Muncul Presisi */
        .card img { width: 100%; height: 200px; object-fit: cover; background: #eee; display: block; }
        .card-body { padding: 10px; }
        .card-title { font-size: 0.85rem; font-weight: 700; height: 40px; overflow: hidden; margin-bottom: 5px; }
        .card-price { color: #10b981; font-weight: 800; font-size: 0.9rem; }
        .btn-buy { width: 100%; padding: 10px; background: #0f172a; color: white; border: none; border-radius: 8px; margin-top: 10px; font-weight: bold; cursor: pointer; }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
        .modal-box { background: white; padding: 20px; border-radius: 15px; width: 100%; max-width: 400px; }
    </style></head><body>
    <header><div style="font-weight:800; color:#38bdf8;">JESTRI E-BOOK</div><div onclick="openCart()" style="cursor:pointer;"><i class="fa-solid fa-cart-shopping"></i> <span id="cc">0</span></div></header>
    <main class="grid" id="grid"></main>
    <div id="modal"><div class="modal-box" id="mContent"></div></div>
    <script>
        let allB = [], cart = [];
        async function load(){ 
            const r = await fetch('/api/buku-json'); 
            allB = await r.json(); 
            document.getElementById('grid').innerHTML = allB.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" loading="lazy" crossorigin="anonymous">
                    <div class="card-body">
                        <div class="card-title">\${x.judul}</div>
                        <div class="card-price">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">AMBIL BUKU</button>
                    </div>
                </div>\`).join('');
        }
        function add(id){
            const b = allB.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) cart.push(b);
            document.getElementById('cc').innerText = cart.length;
            alert("Buku masuk keranjang!");
        }
        function openCart(){
            if(!cart.length) return alert("Pilih buku dulu!");
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`
                <h3>Keranjang Belanja</h3>
                \${cart.map(x=>\`<div style="margin-bottom:5px; border-bottom:1px solid #eee;">• \${x.judul}</div>\`).join('')}
                <p>Total: <b>Rp \${cart.reduce((a,b)=>a+b.harga,0).toLocaleString()}</b></p>
                <input type="file" id="fBukti" style="margin:10px 0;">
                <button onclick="checkout()" id="btnC" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:10px; font-weight:bold;">KONFIRMASI BAYAR</button>
                <button onclick="location.reload()" style="width:100%; border:none; background:none; margin-top:10px; color:gray;">Batal</button>
            \`;
        }
        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Pilih bukti transfer!");
            const btn = document.getElementById('btnC'); btn.innerText = "Mengirim..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url, wallet: "DANA" })
            });
            const data = await res.json();
            document.getElementById('mContent').innerHTML = "<h3>Pesanan Terkirim!</h3><p>Admin akan memproses pesanan Anda. Cek berkala di sini.</p><div id='dl'>⏳</div>";
            setInterval(async () => {
                const rs = await fetch('/api/check/'+data.id); const st = await rs.json();
                if(st.status === 'Approved') document.getElementById('dl').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block; background:#0f172a; color:white; padding:15px; text-decoration:none; text-align:center; border-radius:10px; margin-top:15px;">DOWNLOAD PDF</a>\`;
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
    <form action="/login" method="POST" style="background:white; padding:30px; border-radius:20px; width:300px; text-align:center;">
        <h2 style="margin:0;">ADMIN LOGIN</h2>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:15px; margin:20px 0; border:1px solid #ddd; border-radius:10px; box-sizing:border-box;">
        <button style="width:100%; padding:15px; background:#38bdf8; color:white; border:none; border-radius:10px; font-weight:bold;">LOGIN</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (FIX TOLAK/HAPUS & INPUT) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: sans-serif; background: #f1f5f9; padding: 15px; }
        .card { background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        input, select { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; }
        .btn-save { background: #0f172a; color: white; border: none; padding: 15px; border-radius: 10px; width: 100%; font-weight: bold; cursor: pointer; }
        .btn-acc { background: #10b981; color: white; border: none; padding: 10px; border-radius: 8px; width: 100%; font-weight: bold; cursor: pointer; }
        .btn-del { background: #ef4444; color: white; border: none; padding: 10px; border-radius: 8px; width: 100%; font-weight: bold; cursor: pointer; margin-top: 5px; }
    </style></head><body>
    <h2>DASHBOARD ADMIN</h2>
    <div class="card">
        <h3>Input Buku Baru</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Penulis">
        <input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(x=>`<option>${x}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" class="btn-save">POSTING SEKARANG</button>
    </div>

    <h3>Pesanan Masuk (\${o.length})</h3>
    \${o.map(x => \`
        <div class="card" style="border-left:5px solid #fbbf24;">
            <b>Total: Rp \${x.total.toLocaleString()}</b><br>
            <a href="\${x.bukti}" target="_blank" style="color:#38bdf8; display:block; margin:10px 0;">Lihat Bukti Bayar</a>
            <input type="file" id="pdf-\${x._id}">
            <button onclick="acc('\${x._id}')" class="btn-acc">SETUJUI & KIRIM PDF</button>
            <button onclick="delO('\${x._id}')" class="btn-del">TOLAK / HAPUS PESANAN</button>
        </div>\`).join('')}

    <h3>Daftar Katalog</h3>
    <div class="card">
        \${b.map(x => \`
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
                <div>\${x.judul}</div>
                <button onclick="delB('\${x._id}')" style="background:none; border:none; color:red; cursor:pointer;">HAPUS</button>
            </div>\`).join('')}
    </div>

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
        async function delO(id){
            if(confirm('Tolak pesanan ini?')){
                const r = await fetch('/admin/del-order/'+id, { method: 'DELETE' });
                if(r.ok) location.reload();
            }
        }
        async function delB(id){
            if(confirm('Hapus buku dari katalog?')){
                const r = await fetch('/admin/del-buku/'+id, { method: 'DELETE' });
                if(r.ok) location.reload();
            }
        }
    </script></body></html>`);
});

// --- API ROUTES ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) { await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); } });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); } });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000, () => console.log("🚀 Server Ready!"));

