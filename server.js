const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.log("❌ DB Error", e));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const Order = mongoose.model('Order', { 
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String, pdfLink: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_v5', keys: ['SECRET_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. UI PEMBELI (Sesuai Standar AI lo) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --p: #38bdf8; --d: #0f172a; --bg: #f8fafc; --success: #10b981; }
        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--d); }
        header { background: var(--d); padding: 15px 20px; position: sticky; top: 0; z-index: 1000; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-weight: 800; color: var(--p); font-size: 1.1rem; }
        .cart-icon { position: relative; color: white; cursor: pointer; }
        .badge { position: absolute; top: -8px; right: -10px; background: #ef4444; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 50%; }
        .search-area { background: var(--d); padding: 0 20px 15px; }
        .search-box { background: #1e293b; border-radius: 12px; padding: 10px; display: flex; align-items: center; border: 1px solid #334155; }
        .search-box input { background: none; border: none; color: white; width: 100%; outline: none; margin-left: 10px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 15px; }
        .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-body { padding: 10px; flex-grow: 1; display: flex; flex-direction: column; }
        .card-title { font-size: 0.8rem; font-weight: 700; height: 2.6em; overflow: hidden; }
        .card-price { color: var(--success); font-weight: 800; margin: 5px 0; font-size: 0.9rem; }
        .btn-buy { background: var(--d); color: white; border: none; padding: 8px; border-radius: 8px; font-weight: 700; font-size: 0.7rem; cursor: pointer; }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; padding: 20px; z-index: 10000; }
        .modal-box { background: white; padding: 25px; border-radius: 20px; width: 100%; max-width: 380px; }
    </style></head><body>
    <header>
        <div class="logo">JESTRI E-BOOK</div>
        <div class="cart-icon" onclick="openCart()"><i class="fa-solid fa-shopping-bag"></i><span id="cc" class="badge">0</span></div>
    </header>
    <div class="search-area"><div class="search-box"><i class="fa-solid fa-search" style="color:gray"></i><input type="text" id="sr" placeholder="Cari buku..." oninput="cari()"></div></div>
    <main class="grid" id="mainGrid"></main>
    <div id="modal"><div class="modal-box" id="mContent"></div></div>
    <script>
        let allB = [], cart = [];
        async function load(){ 
            const r = await fetch('/api/buku-json'); 
            allB = await r.json(); 
            render(allB); 
        }
        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/400x600?text=NO+IMAGE'">
                    <div class="card-body">
                        <div class="card-title">\${x.judul}</div>
                        <div class="card-price">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">BELI</button>
                    </div>
                </div>\`).join('');
        }
        function add(id){
            const b = allB.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) cart.push(b);
            document.getElementById('cc').innerText = cart.length;
        }
        function openCart(){
            if(!cart.length) return alert("Kosong!");
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`
                <h3>Checkout</h3>
                \${cart.map(x=>\`<div>• \${x.judul}</div>\`).join('')}
                <p>Total: <b>Rp \${cart.reduce((a,b)=>a+b.harga,0).toLocaleString()}</b></p>
                <select id="wlt" style="width:100%;padding:10px;margin:10px 0;border-radius:10px;">
                    <option value="DANA">DANA (0895327806441)</option>
                </select>
                <input type="file" id="fBukti" style="margin-bottom:15px;">
                <button onclick="checkout()" id="btnC" style="width:100%;padding:15px;background:#10b981;color:white;border:none;border-radius:12px;font-weight:bold;">BAYAR</button>
                <button onclick="location.reload()" style="width:100%;border:none;background:none;margin-top:10px;color:gray;">Batal</button>
            \`;
        }
        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Pilih bukti!");
            const btn = document.getElementById('btnC'); btn.disabled=true; btn.innerText="Uploading...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url, wallet: document.getElementById('wlt').value })
            });
            const order = await res.json();
            document.getElementById('mContent').innerHTML = "<h3>Berhasil!</h3><p>Tunggu admin verifikasi...</p><div id='dl'>⏳</div>";
            setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved') document.getElementById('dl').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block;background:black;color:white;padding:15px;text-align:center;border-radius:10px;text-decoration:none;">UNDUH PDF</a>\`;
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <form action="/login" method="POST" style="background:white;padding:30px;border-radius:20px;width:90%;max-width:350px;text-align:center;">
        <h2>ADMIN LOGIN</h2>
        <input name="pw" type="password" placeholder="Passcode" style="width:100%;padding:15px;margin:15px 0;border-radius:10px;border:1px solid #ddd;text-align:center;">
        <button style="width:100%;padding:15px;background:#38bdf8;color:white;border:none;border-radius:10px;font-weight:bold;">MASUK</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (Fix Tombol Tolak & Gambar) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body{font-family:sans-serif;background:#f1f5f9;padding:15px;margin:0;}
        .card{background:white;padding:15px;border-radius:15px;margin-bottom:15px;box-shadow:0 2px 5px rgba(0,0,0,0.05);}
        input, select{width:100%;padding:12px;margin:10px 0;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;}
        .btn-acc{background:#10b981;color:white;border:none;padding:12px;border-radius:10px;width:100%;font-weight:bold;cursor:pointer;}
        .btn-rej{background:#ef4444;color:white;border:none;padding:10px;border-radius:10px;width:100%;font-weight:bold;cursor:pointer;margin-top:10px;}
    </style></head><body>
    <h2>ADMIN JESTRI</h2>
    <div class="card">
        <h3>Input Buku</h3>
        <input id="j" placeholder="Judul">
        <input id="p" placeholder="Penulis">
        <input id="h" type="number" placeholder="Harga">
        <select id="g">${LIST_GENRE.map(x=>`<option>${x}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" style="width:100%;padding:15px;background:black;color:white;border-radius:10px;">POSTING</button>
    </div>

    <h3>Pesanan Baru (\${o.length})</h3>
    \${o.map(x => \`
        <div class="card" style="border-left:5px solid orange;">
            <b>\${x.wallet} - Rp \${x.total.toLocaleString()}</b>
            <a href="\${x.bukti}" target="_blank" style="display:block;margin:10px 0;color:#38bdf8;">Lihat Bukti TF</a>
            <input type="file" id="pdf-\${x._id}">
            <button onclick="acc('\${x._id}')" class="btn-acc">SETUJUI & KIRIM PDF</button>
            <button onclick="delO('\${x._id}')" class="btn-rej">TOLAK / HAPUS</button>
        </div>\`).join('')}

    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Cover!");
            const btn = document.getElementById('btnS'); btn.disabled=true;
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
            if(confirm('Yakin tolak pesanan ini?')){
                await fetch('/admin/del-order/'+id, { method: 'DELETE' });
                location.reload();
            }
        }
    </script></body></html>`);
});

// --- API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

