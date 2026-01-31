const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.log("❌ DB Error:", e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_v3', keys: ['SECRET_JESTRI_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI PROFESIONAL ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JESTRI STORE | Premium E-Book</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        :root { 
            --merah-gelap: #7f1d1d; --biru-terang: #0ea5e9; --hijau-gelap: #064e3b; 
            --hitam-terang: #1e293b; --putih-terang: #f8fafc; --ungu-gelap: #4c1d95; 
        }
        * { box-sizing: border-box; font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #f1f5f9; color: var(--hitam-terang); }

        /* Header Modern */
        header { 
            background: var(--biru-terang); padding: 15px 20px; color: white; 
            display: flex; justify-content: space-between; align-items: center; 
            position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        /* Sidebar & Overlay */
        .sidebar { position: fixed; top: 0; left: -300px; width: 280px; height: 100%; background: var(--hitam-terang); z-index: 5000; transition: 0.3s; padding: 25px; color: white; }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 4500; display: none; backdrop-filter: blur(3px); }
        
        .nav-item { padding: 12px 15px; margin-bottom: 8px; border-radius: 10px; cursor: pointer; color: #cbd5e1; transition: 0.2s; }
        .nav-item:hover, .nav-item.active { background: var(--biru-terang); color: white; }

        /* Banner */
        .banner { background: var(--ungu-gelap); margin: 15px; padding: 25px; border-radius: 20px; color: white; position: relative; overflow: hidden; }
        .banner h2 { margin: 0; font-size: 1.2rem; position: relative; z-index: 2; }
        .banner p { font-size: 0.8rem; opacity: 0.8; margin: 5px 0 0; position: relative; z-index: 2; }

        /* Grid Produk */
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 15px; }
        .card { background: white; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; flex-direction: column; border: 1px solid rgba(0,0,0,0.05); transition: 0.2s; }
        .card:active { transform: scale(0.97); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-info { padding: 12px; flex-grow: 1; display: flex; flex-direction: column; }
        .card-title { font-weight: 700; font-size: 0.85rem; line-height: 1.2; height: 2.4em; overflow: hidden; }
        .card-author { font-size: 0.7rem; color: #64748b; margin: 4px 0 8px; }
        .card-price { color: var(--hijau-gelap); font-weight: 800; font-size: 0.95rem; margin-top: auto; }
        .btn-add { width: 100%; margin-top: 10px; padding: 10px; background: var(--biru-terang); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 0.75rem; cursor: pointer; }

        /* Floating Cart */
        .floating-cart { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--hitam-terang); color: white; padding: 12px 25px; border-radius: 30px; display: none; align-items: center; gap: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 4000; width: 90%; max-width: 350px; }

        /* Modal */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: none; align-items: flex-end; }
        .m-box { background: white; width: 100%; border-radius: 25px 25px 0 0; padding: 25px; animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    <aside class="sidebar" id="sb">
        <h3 style="color:var(--biru-terang); margin-bottom:20px;">KATEGORI</h3>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua E-Book</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; background:var(--ungu-gelap); color:white; text-align:center; padding:15px; border-radius:12px; margin-top:30px; text-decoration:none; font-weight:bold;">DONASI ADMIN</a>
    </aside>

    <header>
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.3rem; cursor:pointer;"></i>
        <div style="font-weight:800; letter-spacing:-1px; font-size:1.2rem;">JESTRI STORE</div>
        <i class="fa-solid fa-search" style="font-size:1.2rem; opacity:0.8;"></i>
    </header>

    <div class="banner">
        <h2>Koleksi E-Book Terbaik</h2>
        <p>Beli sekali, baca selamanya di perangkat lo.</p>
    </div>

    <div id="genreTitle" style="padding: 0 20px; font-weight: 700; font-size: 1.1rem;">Semua E-Book</div>
    <main class="grid" id="mainGrid"></main>

    <div class="floating-cart" id="fCart" onclick="openCheckout()">
        <i class="fa-solid fa-cart-shopping"></i>
        <span id="cCount" style="flex-grow:1;">0 Item Terpilih</span>
        <span id="cTotal" style="font-weight:800;">Rp 0</span>
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
                    <div class="card-info">
                        <div class="card-title">\${x.judul}</div>
                        <div class="card-author">Oleh \${x.penulis}</div>
                        <div class="card-price">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-add" onclick="add('\${x._id}')">AMBIL BUKU</button>
                    </div>
                </div>\`).join('');
        }

        function setG(g, el){
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); el.classList.add('active');
            document.getElementById('genreTitle').innerText = g;
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g)); tog();
        }

        function add(id){
            const b = allB.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) cart.push(b);
            updateCartUI();
        }

        function updateCartUI(){
            const fc = document.getElementById('fCart');
            if(cart.length > 0) {
                fc.style.display = 'flex';
                document.getElementById('cCount').innerText = cart.length + ' Item';
                document.getElementById('cTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.harga,0).toLocaleString();
            }
        }

        function openCheckout(){
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`
                <h3 style="margin-top:0;">Ringkasan Order</h3>
                <div style="max-height:200px; overflow-y:auto; margin-bottom:15px;">
                    \${cart.map(x => \`<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; font-size:0.85rem;"><span>\${x.judul}</span><b>Rp \${x.harga.toLocaleString()}</b></div>\`).join('')}
                </div>
                <p style="font-size:0.8rem; color:gray;">Kirim Bukti Transfer DANA/OVO ke Admin:</p>
                <input type="file" id="fBukti" style="width:100%; margin-bottom:15px;">
                <button onclick="sendOrder()" id="btnS" style="width:100%; padding:15px; background:var(--hijau-gelap); color:white; border:none; border-radius:12px; font-weight:800;">BAYAR SEKARANG</button>
                <button onclick="location.reload()" style="width:100%; background:none; border:none; color:var(--merah-gelap); margin-top:10px; font-weight:bold; cursor:pointer;">BATAL</button>
            \`;
        }

        async function sendOrder(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Upload bukti transfer!");
            const btn = document.getElementById('btnS'); btn.innerText = "Sabar, Memproses..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items:cart, total:cart.reduce((a,b)=>a+b.total,0), bukti:up.secure_url}) });
            const data = await res.json();
            document.getElementById('mContent').innerHTML = \`<div style="text-align:center; padding:30px 0;"><i class="fa-solid fa-hourglass-half" style="font-size:3rem; color:var(--biru-terang);"></i><h3>Pesanan Diproses</h3><p>Jangan tutup halaman ini, link download muncul di sini setelah divalidasi admin.</p><div id="wait">⌛ Menunggu Konfirmasi Admin...</div></div>\`;
            setInterval(async () => {
                const rs = await fetch('/api/check/'+data.id); const st = await rs.json();
                if(st.status === 'Approved') document.getElementById('wait').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block; background:var(--hijau-gelap); color:white; padding:15px; border-radius:12px; text-decoration:none; font-weight:bold; margin-top:20px;">KLIK UNTUK DOWNLOAD PDF</a>\`;
            }, 4000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (STYLE TETAP SESUAI GAMBAR) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin:0; background:#1e293b; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; }
        .login { position:absolute; inset:60px; display:flex; justify-content:center; align-items:center; flex-direction:column; border-radius:10px; background:#00000033; color:#fff; z-index:1000; box-shadow:inset 0 10px 20px #00000080; border-bottom:2px solid #ffffff80; transition:0.5s; overflow:hidden; }
        input { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:8px; color:white; text-align:center; margin-bottom:15px; outline:none; width:70%; }
        button { background:#0ea5e9; color:white; border:none; padding:12px 30px; border-radius:8px; font-weight:bold; cursor:pointer; width:70%; }
    </style></head><body>
    <form class="login" action="/login" method="POST">
        <h2 style="letter-spacing:2px;">ADMIN</h2>
        <input name="pw" type="password" placeholder="Passcode">
        <button type="submit">ENTER</button>
    </form></body></html>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (PREVENT ERROR) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    const listO = o.map(x => `
        <div style="background:white; padding:15px; border-radius:15px; margin-bottom:10px; border-left:8px solid #0ea5e9;">
            <b>Total: Rp ${x.total.toLocaleString()}</b><br>
            <a href="${x.bukti}" target="_blank">Cek Bukti</a><br>
            <input type="file" id="pdf-${x._id}" style="margin:10px 0; width:100%;">
            <button onclick="acc('${x._id}')" style="background:#064e3b; color:white; padding:8px; border:none; border-radius:5px;">Setujui</button>
        </div>`).join('');
    const listB = b.map(x => `<div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;"><span>${x.judul}</span><button onclick="delB('${x._id}')" style="color:red; border:none; background:none;">Hapus</button></div>`).join('');

    res.send(`<h2>Admin Panel</h2>
    <div style="background:#eee; padding:20px; border-radius:15px;">
        <input id="j" placeholder="Judul"><input id="p" placeholder="Penulis"><input id="h" type="number" placeholder="Harga">
        <select id="g">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <input type="file" id="fi"><button onclick="addB()">Posting</button>
    </div>
    <h3>Order (${o.length})</h3><div>${listO}</div>
    <h3>Katalog</h3><div>${listB}</div>
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0];
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0];
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delB(id){ if(confirm('Hapus?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script>`);
});

// API ROUTES
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

