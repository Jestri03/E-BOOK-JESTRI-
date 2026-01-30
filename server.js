const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DB CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieSession({ name: 'jestri_ultimate', keys: ['ULTRA_KEY_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (FITUR LENGKAP) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JESTRI STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --p: #38bdf8; --d: #0f172a; --bg: #f1f5f9; --white: #ffffff; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--d); }
        
        /* Layout Pembeli */
        header { background: var(--d); padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 15px; max-width: 800px; margin: auto; }
        .card { background: var(--white); border-radius: 18px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; transition: 0.3s; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-body { padding: 12px; }
        .price { color: #10b981; font-weight: 800; font-size: 0.95rem; margin: 8px 0; }
        .btn-buy { width: 100%; padding: 10px; background: var(--d); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }

        /* Sidebar & Overlay */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.3s; padding: 25px; }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 4500; display: none; backdrop-filter: blur(4px); }
        .nav-item { padding: 12px 15px; margin-bottom: 5px; border-radius: 12px; cursor: pointer; font-weight: 600; color: #64748b; transition: 0.2s; }
        .nav-item.active { background: var(--p); color: white; }

        /* Floating Sosmed */
        .sosmed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 4000; }
        .btn-sos { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.5rem; box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: none; align-items: center; justify-content: center; padding: 20px; }
        .m-box { background: white; width: 100%; max-width: 400px; border-radius: 24px; padding: 30px; position: relative; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <aside class="sidebar" id="sb">
        <h2 style="margin-top:0;">Kategori</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <hr><a href="https://link.dana.id/qr/0895327806441" style="text-decoration:none;"><div class="nav-item" style="background:#fbbf24; color:black; text-align:center;"><b><i class="fa-solid fa-heart"></i> DONATE ADMIN</b></div></a>
    </aside>
    <header>
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem; cursor:pointer;"></i>
        <div style="font-weight:800; font-size:1.3rem; color:var(--p);">JESTRI STORE</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;"><i class="fa-solid fa-bag-shopping" style="font-size:1.4rem;"></i><span id="cc" style="position:absolute; top:-5px; right:-8px; background:#ef4444; color:white; font-size:0.65rem; padding:2px 6px; border-radius:50%; font-weight:800;">0</span></div>
    </header>
    <main id="mainGrid" class="grid"></main>
    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="btn-sos" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="btn-sos" style="background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);"><i class="fa-brands fa-instagram"></i></a>
    </div>
    <div id="modal"><div class="m-box" id="mContent"></div></div>
    <script>
        let allB = [], cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ const r = await fetch('/api/buku-json'); allB = await r.json(); render(allB); }
        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/400x600?text=JESTRI'">
                    <div class="card-body">
                        <div style="font-size:0.85rem; font-weight:700; height:2.5em; overflow:hidden;">\${x.judul}</div>
                        <div class="price">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">BELI SEKARANG</button>
                    </div>
                </div>\`).join('');
        }
        function setG(g, el){
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); el.classList.add('active');
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g)); tog();
        }
        function add(id){ const b = allB.find(x => x._id === id); if(!cart.find(x => x._id === id)) cart.push(b); document.getElementById('cc').innerText = cart.length; }
        function openCart(){
            if(!cart.length) return alert("Pilih buku dulu!");
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`<h3>Check Out</h3>\${cart.map(x=>\`<div style="font-size:0.9rem; margin-bottom:5px;">• \${x.judul}</div>\`).join('')}<p>Total: <b style="color:#10b981;">Rp \${cart.reduce((a,b)=>a+b.harga,0).toLocaleString()}</b></p><hr><label style="font-size:0.8rem;">Upload Bukti DANA/OVO:</label><input type="file" id="fBukti" style="margin:10px 0; width:100%;"><button onclick="checkout()" id="btnC" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:12px; font-weight:800; margin-top:10px;">KONFIRMASI PEMBAYARAN</button><button onclick="location.reload()" style="width:100%; background:none; border:none; color:gray; margin-top:10px;">Batal</button>\`;
        }
        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Upload bukti!");
            const btn = document.getElementById('btnC'); btn.innerText = "Mengirim..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url }) });
            const data = await res.json();
            document.getElementById('mContent').innerHTML = "<h3>Pesanan Diproses</h3><p>Admin sedang memverifikasi bukti transfer lo...</p><div id='dl' style='font-size:2.5rem; text-align:center;'>⏳</div>";
            setInterval(async () => {
                const rs = await fetch('/api/check/'+data.id); const st = await rs.json();
                if(st.status === 'Approved') document.getElementById('dl').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block; background:var(--d); color:white; padding:18px; text-align:center; border-radius:15px; text-decoration:none; font-weight:800; margin-top:20px;">DOWNLOAD E-BOOK PDF</a>\`;
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (PRESISI) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif;">
    <form action="/login" method="POST" style="background:white; padding:40px; border-radius:28px; width:340px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
        <h2 style="margin:0; color:#0f172a;">JESTRI ADMIN</h2>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:15px; margin:25px 0; border:2px solid #e2e8f0; border-radius:12px; text-align:center; font-size:1.2rem; outline:none;">
        <button style="width:100%; padding:15px; background:#38bdf8; color:white; border:none; border-radius:12px; font-weight:800; cursor:pointer;">LOGIN</button>
    </form></body>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (PRESISI & SEIMBANG) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    const listO = o.map(x => `
        <div style="background:white; padding:18px; border-radius:18px; margin-bottom:15px; border-left:6px solid #fbbf24; box-shadow:0 4px 10px rgba(0,0,0,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <b style="font-size:1.1rem;">Rp ${x.total.toLocaleString()}</b>
                <a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.8rem; text-decoration:none; font-weight:700;">LIHAT BUKTI <i class="fa-solid fa-up-right-from-square"></i></a>
            </div>
            <div style="background:#f8fafc; padding:10px; border-radius:10px; border:1px dashed #cbd5e1; margin-bottom:10px;">
                <label style="font-size:0.7rem; color:#64748b; font-weight:800;">PILIH FILE EBOOK (PDF):</label>
                <input type="file" id="pdf-${x._id}" style="font-size:0.8rem; margin-top:5px;">
            </div>
            <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:10px;">
                <button onclick="acc('${x._id}')" style="padding:12px; background:#10b981; color:white; border:none; border-radius:10px; font-weight:800;">SETUJUI</button>
                <button onclick="delO('${x._id}')" style="padding:12px; background:#fee2e2; color:#ef4444; border:none; border-radius:10px; font-weight:800;">TOLAK</button>
            </div>
        </div>`).join('');

    const listB = b.map(x => `
        <div style="display:flex; align-items:center; gap:15px; padding:12px; background:white; border-radius:15px; margin-bottom:10px; border:1px solid #f1f5f9;">
            <img src="${x.gambar}" style="width:40px; height:50px; object-fit:cover; border-radius:8px;">
            <div style="flex-grow:1; font-weight:700; font-size:0.85rem;">${x.judul}</div>
            <button onclick="delB('${x._id}')" style="color:#ef4444; background:none; border:none; font-size:1.1rem;"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#f8fafc; margin:0; padding:20px; }
        .box { background:white; padding:25px; border-radius:24px; border:1px solid #e2e8f0; margin-bottom:25px; box-shadow:0 4px 15px rgba(0,0,0,0.02); }
        input, select { width:100%; padding:14px; margin-bottom:12px; border:1px solid #e2e8f0; border-radius:12px; outline:none; font-size:0.9rem; box-sizing:border-box; }
        .btn-post { width:100%; padding:16px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:800; cursor:pointer; font-size:1rem; }
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2 style="margin:0;">Admin Panel</h2> <a href="/" style="color:#0f172a; text-decoration:none; font-weight:700;"><i class="fa-solid fa-store"></i> Toko</a>
    </div>
    <div class="box">
        <h3 style="margin-top:0;"><i class="fa-solid fa-plus-circle"></i> Posting Buku</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <label style="font-size:0.75rem; color:#64748b; font-weight:800;">COVER BUKU:</label>
        <input type="file" id="fi" style="border:none; padding:5px 0;">
        <button onclick="addB()" id="btnS" class="btn-post">POSTING SEKARANG</button>
    </div>
    <h3 style="margin-bottom:15px;"><i class="fa-solid fa-clock"></i> Pesanan Pending (${o.length})</h3>
    <div>${listO || '<p style="color:gray; text-align:center;">Tidak ada pesanan</p>'}</div>
    <h3 style="margin:25px 0 15px;"><i class="fa-solid fa-book"></i> Katalog Produk (${b.length})</h3>
    <div style="margin-bottom:50px;">${listB}</div>
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "Uploading..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
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

// --- API ROUTES ---
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

