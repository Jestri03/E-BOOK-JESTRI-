const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ Database Ready")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieSession({ name: 'jestri_premium', keys: ['JESTRI_ULTRA_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (PENYEMPURNAAN TOTAL) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI STORE | Premium E-Book</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { 
            --merah: #7f1d1d; --biru: #0ea5e9; --hijau: #064e3b; 
            --hitam: #1e293b; --putih: #f8fafc; --ungu: #4c1d95; 
        }
        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: var(--putih); color: var(--hitam); overflow-x: hidden; }

        /* Header Premium */
        header { 
            background: var(--biru); padding: 18px 20px; color: white; 
            display: flex; justify-content: space-between; align-items: center; 
            position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
        }
        .logo { font-weight: 800; font-size: 1.4rem; letter-spacing: -0.5px; }

        /* Sidebar Hitam Terang */
        .sidebar { 
            position: fixed; top: 0; left: -100%; width: 85%; max-width: 300px; height: 100%; 
            background: var(--hitam); z-index: 5000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
            padding: 30px 20px; box-shadow: 20px 0 50px rgba(0,0,0,0.3);
        }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 4500; display: none; backdrop-filter: blur(4px); }
        
        .nav-title { color: var(--biru); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px; }
        .nav-item { 
            padding: 14px 18px; margin-bottom: 8px; border-radius: 12px; cursor: pointer; 
            color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.05); transition: 0.3s;
            display: flex; align-items: center; gap: 10px;
        }
        .nav-item.active { background: var(--biru); color: white; border: none; font-weight: 700; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4); }
        .btn-donate { 
            background: var(--ungu); padding: 16px; border-radius: 14px; text-align: center; 
            color: white; text-decoration: none; display: block; margin-top: 30px; font-weight: 800;
            box-shadow: 0 4px 15px rgba(76, 29, 149, 0.4);
        }

        /* Katalog Grid */
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 20px; max-width: 1000px; margin: 0 auto; }
        .card { 
            background: white; border-radius: 20px; overflow: hidden; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.05); transition: 0.3s;
            display: flex; flex-direction: column; border: 1px solid rgba(0,0,0,0.03);
        }
        .card:active { transform: scale(0.96); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-body { padding: 12px; display: flex; flex-direction: column; flex-grow: 1; }
        .judul { font-weight: 700; font-size: 0.9rem; line-height: 1.3; height: 2.6em; overflow: hidden; margin-bottom: 4px; }
        .penulis { font-size: 0.75rem; color: #94a3b8; margin-bottom: 10px; font-weight: 500; }
        .harga { color: var(--hijau); font-weight: 800; font-size: 1rem; margin-top: auto; }
        .btn-buy { 
            width: 100%; margin-top: 12px; padding: 12px; background: var(--biru); 
            color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 0.8rem;
        }

        /* Cart Badge */
        .badge { 
            position: absolute; top: -8px; right: -10px; background: var(--merah); 
            color: white; padding: 2px 7px; border-radius: 50%; font-size: 0.65rem; font-weight: 800;
            border: 2px solid var(--biru);
        }

        /* Modal Checkout */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: none; align-items: flex-end; }
        .m-box { 
            background: white; width: 100%; border-radius: 30px 30px 0 0; padding: 30px; 
            animation: slideUp 0.4s ease; max-height: 90vh; overflow-y: auto;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    
    <aside class="sidebar" id="sb">
        <div class="nav-title">Menu Kategori</div>
        <div class="nav-item active" onclick="setG('Semua', this)"><i class="fa-solid fa-layer-group"></i> Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)"><i class="fa-solid fa-bookmark"></i> ${g}</div>`).join('')}
        <div style="margin-top:40px;" class="nav-title">Dukungan</div>
        <a href="https://link.dana.id/qr/0895327806441" class="btn-donate"><i class="fa-solid fa-heart"></i> DONASI ADMIN</a>
    </aside>

    <header>
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem; cursor:pointer;"></i>
        <div class="logo">JESTRI STORE</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;">
            <i class="fa-solid fa-bag-shopping" style="font-size:1.4rem;"></i>
            <span id="cc" class="badge">0</span>
        </div>
    </header>

    <div style="padding: 20px 20px 0; font-weight: 800; font-size: 1.2rem;" id="currentGenre">Semua Koleksi</div>
    <main class="grid" id="mainGrid"></main>

    <div id="modal" onclick="closeM(event)"><div class="m-box" id="mContent" onclick="event.stopPropagation()"></div></div>

    <script>
        let allB = [], cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        function closeM(e){ document.getElementById('modal').style.display = 'none'; }
        
        async function load(){ const r = await fetch('/api/buku-json'); allB = await r.json(); render(allB); }
        
        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" loading="lazy">
                    <div class="card-body">
                        <div class="judul">\${x.judul}</div>
                        <div class="penulis">By \${x.penulis || 'Jestri Editor'}</div>
                        <div class="harga">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">TAMBAH KE TAS</button>
                    </div>
                </div>\`).join('');
        }

        function setG(g, el){ 
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); 
            el.classList.add('active'); 
            document.getElementById('currentGenre').innerText = g;
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g)); 
            tog(); 
        }

        function add(id){ 
            const b = allB.find(x => x._id === id); 
            if(!cart.find(x => x._id === id)) cart.push(b); 
            document.getElementById('cc').innerText = cart.length;
            // Animasi kecil pada badge
            document.getElementById('cc').style.transform = 'scale(1.3)';
            setTimeout(() => document.getElementById('cc').style.transform = 'scale(1)', 200);
        }

        function openCart(){
            if(!cart.length) return alert("Tas belanja lo masih kosong!");
            const total = cart.reduce((a,b)=>a+b.harga,0);
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`
                <h2 style="margin-top:0;">Konfirmasi Pesanan</h2>
                <div style="margin-bottom:20px; max-height:200px; overflow-y:auto;">
                    \${cart.map(x=>\`<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;"><span>\${x.judul}</span><b>Rp \${x.harga.toLocaleString()}</b></div>\`).join('')}
                </div>
                <div style="display:flex; justify-content:space-between; font-size:1.2rem; font-weight:800; margin-bottom:20px;">
                    <span>Total</span><span style="color:var(--hijau);">Rp \${total.toLocaleString()}</span>
                </div>
                <div style="background:#f1f5f9; padding:15px; border-radius:15px; margin-bottom:20px;">
                    <label style="font-size:0.8rem; font-weight:700;">Upload Bukti Transfer (DANA/OVO):</label>
                    <input type="file" id="fBukti" style="margin-top:10px; width:100%;">
                </div>
                <button onclick="checkout()" id="btnC" style="width:100%; padding:18px; background:var(--hijau); color:white; border:none; border-radius:15px; font-weight:800; font-size:1rem;">KIRIM PESANAN SEKARANG</button>
                <button onclick="location.reload()" style="width:100%; padding:15px; background:none; border:none; color:var(--merah); font-weight:700; margin-top:10px;">Batalkan Semua</button>
            \`;
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Wajib upload bukti!");
            const btn = document.getElementById('btnC'); btn.innerText = "Memproses..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url }) });
            const data = await res.json();
            document.getElementById('mContent').innerHTML = \`
                <div style="text-align:center; padding:40px 0;">
                    <i class="fa-solid fa-circle-check" style="font-size:4rem; color:var(--hijau);"></i>
                    <h3>Pesanan Diterima!</h3>
                    <p style="color:gray;">Admin sedang mengecek pembayaran lo. Jangan tutup halaman ini ya.</p>
                    <div id="dlBox" style="margin-top:30px;">
                        <div class="spinner" style="margin:0 auto;"></div>
                        <p style="font-size:0.8rem; margin-top:10px;">Menunggu Verifikasi...</p>
                    </div>
                </div>\`;
            
            const timer = setInterval(async () => {
                const rs = await fetch('/api/check/'+data.id); const st = await rs.json();
                if(st.status === 'Approved') {
                    clearInterval(timer);
                    document.getElementById('dlBox').innerHTML = \`
                        <a href="\${st.pdfLink}" download style="display:block; background:var(--biru); color:white; padding:18px; text-align:center; border-radius:15px; text-decoration:none; font-weight:800; box-shadow:0 10px 20px rgba(14,165,233,0.3);">
                            <i class="fa-solid fa-download"></i> DOWNLOAD E-BOOK PDF
                        </a>\`;
                }
            }, 3000);
        }
        load();
    </script>
    <style> .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--biru); border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } </style>
    </body></html>`);
});

// --- 2. LOGIN ADMIN (STYLE TETAP SESUAI GAMBAR REQ) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin:0; background:#1e293b; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; }
        .login { position:absolute; inset:60px; display:flex; justify-content:center; align-items:center; flex-direction:column; border-radius:10px; background:#00000033; color:#fff; z-index:1000; box-shadow:inset 0 10px 20px #00000080; border-bottom:2px solid #ffffff80; transition:0.5s; overflow:hidden; }
        input { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:8px; color:white; text-align:center; margin-bottom:15px; outline:none; width:70%; }
        button { background:#0ea5e9; color:white; border:none; padding:12px 30px; border-radius:8px; font-weight:bold; cursor:pointer; width:70%; }
    </style></head><body>
    <form class="login" action="/login" method="POST">
        <h2 style="letter-spacing:2px; margin-bottom:20px;">ADMIN ACCESS</h2>
        <input name="pw" type="password" placeholder="Passcode">
        <button type="submit">ENTER</button>
    </form></body></html>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (PREVENT "CODE LEAK" BUG) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    const listO = o.map(x => `
        <div style="background:white; padding:18px; border-radius:18px; margin-bottom:15px; border-left:8px solid #0ea5e9; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <b style="color:#064e3b; font-size:1.1rem;">Rp ${x.total.toLocaleString()}</b>
                <a href="${x.bukti}" target="_blank" style="color:#0ea5e9; font-weight:700; text-decoration:none; font-size:0.8rem;">LIHAT BUKTI</a>
            </div>
            <div style="background:#f8fafc; padding:10px; border-radius:10px; margin-bottom:10px;">
                <label style="font-size:0.7rem; font-weight:800;">UPLOAD PDF E-BOOK:</label>
                <input type="file" id="pdf-${x._id}" style="font-size:0.8rem; margin-top:5px; width:100%;">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <button onclick="acc('${x._id}')" style="padding:12px; background:#064e3b; color:white; border:none; border-radius:10px; font-weight:bold;">SETUJUI</button>
                <button onclick="delO('${x._id}')" style="padding:12px; background:#7f1d1d; color:white; border:none; border-radius:10px; font-weight:bold;">TOLAK</button>
            </div>
        </div>`).join('');

    const listB = b.map(x => `
        <div style="display:flex; align-items:center; gap:12px; padding:12px; background:white; border-bottom:1px solid #f1f5f9;">
            <img src="${x.gambar}" style="width:40px; height:50px; object-fit:cover; border-radius:6px;">
            <div style="flex-grow:1;"><div style="font-weight:700; font-size:0.85rem;">${x.judul}</div><div style="font-size:0.7rem; color:gray;">${x.penulis}</div></div>
            <button onclick="delB('${x._id}')" style="color:#7f1d1d; border:none; background:none; font-size:1.2rem;"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family:sans-serif; background:#f1f5f9; margin:0; padding:20px; }
        .box { background:white; padding:25px; border-radius:20px; box-shadow:0 4px 15px rgba(0,0,0,0.05); margin-bottom:25px; }
        input, select { width:100%; padding:14px; margin-bottom:12px; border:1px solid #e2e8f0; border-radius:12px; box-sizing:border-box; }
        h3 { border-left:5px solid #0ea5e9; padding-left:10px; font-size:1.1rem; }
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2 style="margin:0;">Jestri Admin</h2>
        <a href="/" style="color:#0ea5e9; font-weight:700; text-decoration:none;">LIHAT TOKO</a>
    </div>
    <div class="box">
        <h3>Posting E-Book</h3>
        <input id="j" placeholder="Judul Lengkap"><input id="p" placeholder="Nama Penulis"><input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" style="width:100%; padding:16px; background:#1e293b; color:white; border:none; border-radius:12px; font-weight:800; font-size:1rem;">PUBLIKASIKAN BUKU</button>
    </div>
    <h3>Pesanan Menunggu (${o.length})</h3>
    <div>${listO || '<p style="text-align:center; color:gray;">Belum ada pesanan masuk</p>'}</div>
    <h3>Katalog Stok</h3>
    <div class="box" style="padding:0;">${listB}</div>
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Cover wajib!");
            const btn = document.getElementById('btnS'); btn.innerText = "Sabar, lagi upload..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("PDF-nya mana bos?");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delO(id){ if(confirm('Hapus pesanan ini?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); lo
