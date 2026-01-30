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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_v10', keys: ['JESTRI_ULTRON'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. UI PEMBELI (FULL FEATURES) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI E-BOOK STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --p: #38bdf8; --d: #0f172a; --bg: #f8fafc; --success: #10b981; }
        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: var(--bg); color: var(--d); overflow-x: hidden; }

        /* Sidebar & Overlay */
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 4500; display: none; backdrop-filter: blur(4px); }
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.3s; padding: 25px; box-shadow: 10px 0 30px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .nav-link { padding: 12px 15px; border-radius: 10px; cursor: pointer; color: #475569; font-weight: 600; display: block; text-decoration: none; margin-bottom: 5px; }
        .nav-link.active { background: var(--p); color: white; }

        /* Header */
        header { background: var(--d); padding: 15px 20px; position: sticky; top: 0; z-index: 1000; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-weight: 800; color: var(--p); font-size: 1.2rem; }
        .cart-icon { position: relative; color: white; cursor: pointer; font-size: 1.3rem; }
        .badge { position: absolute; top: -5px; right: -8px; background: #ef4444; color: white; font-size: 0.6rem; padding: 2px 5px; border-radius: 50%; font-weight: 800; }

        /* Grid */
        .container { padding: 15px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: 0.2s; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f1f5f9; }
        .card-body { padding: 10px; flex-grow: 1; display: flex; flex-direction: column; }
        .card-title { font-size: 0.8rem; font-weight: 700; height: 2.6em; overflow: hidden; line-height: 1.3; margin-bottom: 5px; }
        .btn-buy { width: 100%; padding: 8px; border: none; border-radius: 8px; background: var(--d); color: white; font-weight: 700; font-size: 0.7rem; cursor: pointer; }

        /* Floating Sosmed */
        .sosmed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 4000; }
        .btn-sos { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.4rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }

        /* Modal */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .modal-box { background: white; width: 100%; max-width: 380px; border-radius: 20px; padding: 25px; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    <aside class="sidebar" id="sb">
        <h2 style="margin:0 0 20px;">KATEGORI</h2>
        <div class="nav-link active" onclick="setG('Semua', this)">Semua Buku</div>
        ${LIST_GENRE.map(g => `<div class="nav-link" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <hr>
        <a href="https://link.dana.id/qr/0895327806441" class="nav-link" style="background:#fbbf24; color:black; text-align:center;"><b><i class="fa-solid fa-heart"></i> DONATE ADMIN</b></a>
    </aside>

    <header>
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="color:white; cursor:pointer; font-size:1.2rem;"></i>
        <div class="logo">JESTRI E-BOOK</div>
        <div class="cart-icon" onclick="openCart()"><i class="fa-solid fa-shopping-bag"></i><span id="cc" class="badge">0</span></div>
    </header>

    <main class="container"><div id="mainGrid" class="grid"></div></main>

    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="btn-sos" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="btn-sos" style="background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal"><div class="modal-box" id="mContent"></div></div>

    <script>
        let allB = [], cart = [], curG = 'Semua';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        
        async function load(){ 
            const r = await fetch('/api/buku-json'); 
            allB = await r.json(); 
            render(allB); 
        }

        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => `
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/400x600?text=JESTRI'">
                    <div class="card-body">
                        <div class="card-title">\${x.judul}</div>
                        <div style="color:var(--success); font-weight:800; font-size:0.9rem; margin-bottom:10px;">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">BELI BUKU</button>
                    </div>
                </div>`).join('');
        }

        function setG(g, el){
            curG = g;
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g));
            tog();
        }

        function add(id){
            const b = allB.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) cart.push(b);
            document.getElementById('cc').innerText = cart.length;
        }

        function openCart(){
            if(!cart.length) return alert("Pilih buku dulu!");
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`
                <h3 style="margin-top:0;">Keranjang Belanja</h3>
                \${cart.map(x=>\`<div style="font-size:0.85rem; margin-bottom:5px;">• \${x.judul}</div>\`).join('')}
                <p>Total: <b style="color:var(--success);">Rp \${cart.reduce((a,b)=>a+b.harga,0).toLocaleString()}</b></p>
                <p style="font-size:0.7rem; color:gray;">Transfer DANA/OVO: 0895327806441</p>
                <input type="file" id="fBukti" style="margin:10px 0;">
                <button onclick="checkout()" id="btnC" style="width:100%; padding:15px; background:var(--success); color:white; border:none; border-radius:12px; font-weight:bold;">KONFIRMASI BAYAR</button>
                <button onclick="location.reload()" style="width:100%; border:none; background:none; color:gray; margin-top:10px;">Batal</button>
            \`;
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Upload bukti!");
            const btn = document.getElementById('btnC'); btn.innerText = "Mengirim..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url })
            });
            const data = await res.json();
            document.getElementById('mContent').innerHTML = "<h3>Berhasil!</h3><p>Admin verifikasi dulu ya...</p><div id='dl' style='font-size:2rem;'>⏳</div>";
            setInterval(async () => {
                const rs = await fetch('/api/check/'+data.id); const st = await rs.json();
                if(st.status === 'Approved') document.getElementById('dl').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block; background:var(--d); color:white; padding:15px; text-align:center; border-radius:12px; text-decoration:none; font-weight:bold; margin-top:15px;">DOWNLOAD PDF</a>\`;
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN & ADMIN (TETAP AMAN) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif;">
    <form action="/login" method="POST" style="background:white; padding:30px; border-radius:20px; width:300px; text-align:center;">
        <h2 style="margin-top:0;">ADMIN LOGIN</h2>
        <input name="pw" type="password" placeholder="Passcode" style="width:100%; padding:15px; margin:20px 0; border:1px solid #ddd; border-radius:10px; text-align:center;">
        <button style="width:100%; padding:15px; background:#38bdf8; color:white; border:none; border-radius:10px; font-weight:bold;">MASUK</button>
    </form></body>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    const listOrder = o.map(x => `<div style="background:white; padding:15px; border-radius:12px; margin-bottom:15px; border-left:5px solid orange;">
        <b>Pesanan: Rp ${x.total.toLocaleString()}</b><br>
        <a href="${x.bukti}" target="_blank" style="color:#38bdf8;">Lihat Bukti TF</a><br>
        <input type="file" id="pdf-${x._id}" style="margin:10px 0;">
        <button onclick="acc('${x._id}')" style="width:100%; padding:10px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold;">SETUJUI</button>
        <button onclick="delO('${x._id}')" style="width:100%; padding:8px; background:#ef4444; color:white; border:none; border-radius:8px; margin-top:5px;">TOLAK</button>
    </div>`).join('');
    const listBuku = b.map(x => `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;"><span>${x.judul}</span><button onclick="delB('${x._id}')" style="color:red; background:none; border:none;">Hapus</button></div>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body{font-family:sans-serif; background:#f1f5f9; padding:15px;}.card{background:white; padding:20px; border-radius:15px; margin-bottom:20px;}</style>
    </head><body>
    <h2>DASHBOARD ADMIN</h2>
    <div class="card">
        <h3>Input Buku</h3>
        <input id="j" placeholder="Judul" style="width:100%; padding:10px; margin-bottom:10px;">
        <input id="p" placeholder="Penulis" style="width:100%; padding:10px; margin-bottom:10px;">
        <input id="h" type="number" placeholder="Harga" style="width:100%; padding:10px; margin-bottom:10px;">
        <select id="g" style="width:100%; padding:10px; margin-bottom:10px;">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" style="width:100%; padding:15px; background:black; color:white; border-radius:10px; margin-top:10px;">POSTING</button>
    </div>
    <h3>Order Masuk</h3><div>${listOrder}</div>
    <h3>Katalog</h3><div class="card">${listBuku}</div>
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "Processing...";
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
        async function delO(id){ if(confirm('Hapus?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        async function delB(id){ if(confirm('Hapus?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ROUTES ---
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000, () => console.log("🚀 Berjalan Sempurna!"));

