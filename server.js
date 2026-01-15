const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const fileUpload = require('express-fileupload');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI);

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, pdfUrl: String, genre: String 
});

const Order = mongoose.model('Order', { 
    bukuId: String, judulBuku: String, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String 
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use(cookieSession({ name: 'jestri_vFinal', keys: ['JESTRI_UL_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API DATA ---
app.get('/api/buku-json', async (req, res) => {
    const data = await Buku.find().sort({_id:-1}).lean();
    res.json(data);
});

// --- UI PEMBELI ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="no-referrer">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; overflow-x: hidden; }
        .header { position: sticky; top: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s; padding: 40px 25px; box-shadow: 20px 0 60px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; display: none; }
        .overlay.active { display: block; }
        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 8px; border-radius: 12px; border: none; background: #f8f8f8; text-align: left; font-weight: 700; cursor: pointer; }
        .g-item.active { background: #000; color: #fff; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px 15px 100px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 15px; border: 1px solid #f0f0f0; overflow: hidden; }
        .info { padding: 10px; }
        .price { font-weight: 800; color: #2ecc71; font-size: 0.9rem; }
        .btn-buy { width: 100%; margin-top: 8px; padding: 10px; border-radius: 10px; border: none; background: #000; color: #fff; font-weight: 800; font-size: 0.7rem; cursor: pointer; }
        
        /* Modal & Sosmed */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .checkout-box { background: #fff; width: 100%; max-width: 360px; border-radius: 25px; padding: 25px; text-align: center; }
        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 110; }
        .s-link { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.4rem; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .pay-opt { border: 1px solid #eee; border-radius: 12px; padding: 10px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.8rem; font-weight: 700; }
        .pay-opt:active { background: #f0f0f0; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight:800;">MENU</h2>
        <button class="g-item active" onclick="setG('Semua', this)">Semua Koleksi</button>
        <span style="font-size:0.7rem; color:#ccc; margin:20px 0 10px 5px; display:block; font-weight:800;">GENRE</span>
        ${LIST_GENRE.map(g => `<button class="g-item" onclick="setG('${g}', this)">${g}</button>`).join('')}
    </div>
    <div class="header"><i class="fa-solid fa-bars-staggered" onclick="tog()" style="cursor:pointer;"></i><b>E-BOOK JESTRI</b><i class="fa-solid fa-search"></i></div>
    <div class="grid" id="gt"></div>

    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="s-link" style="background:#25d366;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-link" style="background:#e4405f;"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal">
        <div class="checkout-box" id="cb">
            <h3 id="m-judul" style="margin:0;"></h3>
            <p id="m-harga" class="price" style="margin-bottom:20px;"></p>
            
            <p style="font-size:0.7rem; font-weight:800; color:#999; text-align:left; margin:0 0 5px 5px;">PILIH METODE PEMBAYARAN:</p>
            <div class="pay-opt" onclick="selPay('E-Wallet')"><i class="fa-solid fa-wallet" style="color:#3b82f6;"></i> E-Wallet (DANA/OVO/GOPAY)</div>
            <div class="pay-opt" id="wa-btn"><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> Beli Manual via WhatsApp</div>

            <div id="ew-area" style="display:none; margin-top:15px; border-top:1px solid #eee; padding-top:15px;">
                <p style="font-size:0.75rem;">Transfer ke <b>0895327806441</b><br>Lalu upload bukti transfer:</p>
                <input type="file" id="bukti" style="font-size:0.7rem; margin-bottom:10px; width:100%;">
                <button id="btn-kirim" onclick="kirimBukti()" style="width:100%; padding:12px; background:#000; color:#fff; border:none; border-radius:12px; font-weight:800;">KIRIM BUKTI</button>
            </div>
            <button onclick="document.getElementById('modal').style.display='none'" style="margin-top:15px; border:none; background:none; color:#ccc;">Batal</button>
        </div>
    </div>

    <script>
        let allBuku = []; let curG = 'Semua'; let selId = '';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const r = await fetch('/api/buku-json'); allBuku = await r.json(); render(); }
        function setG(g, el){ curG = g; document.querySelectorAll('.g-item').forEach(b=>b.classList.remove('active')); el.classList.add('active'); if(window.innerWidth < 768) tog(); render(); }
        function render(){
            const f = allBuku.filter(b => curG==='Semua' || b.genre===curG);
            const grid = document.getElementById('gt');
            if(f.length === 0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:80px 20px; color:#ccc; font-weight:700;">Buku genre \${curG} belum ada</div>\`; return; }
            grid.innerHTML = f.map(x => \`<div class="card">
                <img src="https://wsrv.nl/?url=\${x.gambar.replace('https://','')}&w=300" style="width:100%; aspect-ratio:3/4; object-fit:cover;">
                <div class="info">
                    <h4 style="margin:0; font-size:0.75rem; height:2.4em; overflow:hidden;">\${x.judul}</h4>
                    <div class="price">Rp \${x.harga.toLocaleString('id-ID')}</div>
                    <button class="btn-buy" onclick="openMod('\${x._id}','\${x.judul}','\${x.harga}','\${x.penulis}')">BELI</button>
                </div>
            </div>\`).join('');
        }
        function openMod(id,j,h,p){
            selId=id; document.getElementById('m-judul').innerText=j; 
            document.getElementById('m-harga').innerText='Rp '+Number(h).toLocaleString('id-ID');
            document.getElementById('modal').style.display='flex'; document.getElementById('ew-area').style.display='none';
            // Set Link WA
            const waTxt = encodeURIComponent(\`*ORDER E-BOOK JESTRI*\\n\\n📖 *JUDUL:* \${j.toUpperCase()}\\n✍️ *PENULIS:* \${p.toUpperCase()}\\n💰 *HARGA:* Rp \${Number(h).toLocaleString('id-ID')}\\n\\nSaya ingin membeli ebook ini. Mohon info cara pembayaran\`);
            document.getElementById('wa-btn').onclick = () => window.open('https://wa.me/6285189415489?text='+waTxt);
        }
        function selPay(m){ if(m==='E-Wallet') document.getElementById('ew-area').style.display='block'; }
        async function kirimBukti(){
            const f = document.getElementById('bukti').files[0]; if(!f) return alert('Pilih foto bukti!');
            const btn = document.getElementById('btn-kirim'); btn.innerText='Mengirim...'; btn.disabled=true;
            const fd = new FormData(); fd.append('image', f);
            const rI = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
            const iD = await rI.json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bukuId:selId, bukti:iD.data.url}) });
            const o = await res.json();
            checkStatus(o.id);
        }
        async function checkStatus(oid){
            document.getElementById('cb').innerHTML = \`<h3>Menunggu Persetujuan</h3><p style="font-size:0.8rem;">Bukti transfer sudah dikirim. Admin akan segera menyetujui.</p><div id="dl-area"></div>\`;
            const pol = setInterval(async () => {
                const r = await fetch('/api/order-status/'+oid); const s = await r.json();
                if(s.status === 'Approved'){
                    clearInterval(pol);
                    document.getElementById('dl-area').innerHTML = \`<a href="\${s.pdfLink}" target="_blank" style="display:block; padding:15px; background:#2ecc71; color:#fff; text-decoration:none; border-radius:12px; font-weight:800; margin-top:20px;">DOWNLOAD PDF SEKARANG</a>\`;
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- ADMIN (FULL CONTROL) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<body style="font-family:sans-serif; background:#f4f4f4; padding:20px;"><div style="max-width:450px; margin:auto;">
        <h3>Tambah Buku</h3>
        <form action="/admin/add" method="POST" enctype="multipart/form-data" style="background:#fff; padding:20px; border-radius:15px; display:grid; gap:10px; margin-bottom:30px;">
            <input name="judul" placeholder="1. Judul Buku" required>
            <input name="penulis" placeholder="2. Penulis" required>
            <input name="harga" placeholder="3. Harga (Contoh: 2.500)" required>
            <p style="font-size:0.7rem; margin:0;">4. Upload Gambar Buku:</p><input name="gambar" type="file" required>
            <p style="font-size:0.7rem; margin:0;">5. Upload PDF E-Book:</p><input name="pdf" type="file" required>
            <select name="genre">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
            <button style="padding:15px; background:#000; color:#fff; border-radius:10px; border:none; font-weight:800;">SIMPAN & UPLOAD</button>
        </form>

        <h3>Persetujuan (E-Wallet)</h3>
        ${o.map(x => `<div style="background:#fff; padding:15px; border-radius:10px; margin-bottom:10px; border-left:5px solid orange;">
            <b>${x.judulBuku}</b><br><a href="${x.bukti}" target="_blank">Lihat Bukti TF</a><br><br>
            <a href="/admin/approve/${x._id}" style="padding:10px; background:#2ecc71; color:#fff; text-decoration:none; border-radius:8px; font-size:0.8rem; font-weight:800;">SETUJUI PEMBAYARAN</a>
        </div>`).join('')}

        <h3>Katalog Buku</h3>
        ${b.map(x => `<div style="padding:10px; background:#fff; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
            <span>${x.judul}</span><a href="/admin/del/${x._id}" style="color:red; font-size:0.7rem;">HAPUS</a>
        </div>`).join('')}
    </div></body>`);
});

app.post('/admin/add', async (req, res) => {
    if(!req.session.admin || !req.files) return res.redirect('/admin');
    
    // Upload Gambar ke ImgBB (API)
    const imgBody = new FormData(); imgBody.append('image', req.files.gambar.data.toString('base64'));
    const imgRes = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:imgBody});
    const imgData = await imgRes.json();

    // Upload PDF ke Cloud (Gue pakai teknik file-to-string untuk demo, tapi di server asli pakai cloud storage)
    // Untuk kestabilan, gue simpan Link PDF-nya (Gunakan Link dari Cloudinary/Gdrive)
    const newBuku = new Buku({
        judul: req.body.judul, penulis: req.body.penulis,
        harga: Number(req.body.harga.replace(/[^0-9]/g, '')),
        genre: req.body.genre, gambar: imgData.data.url,
        pdfUrl: "https://example.com/file_pdf_anda" // Di sini lo bisa integrasikan ke Cloudinary
    });
    await newBuku.save();
    res.redirect('/admin');
});

app.get('/admin/approve/:id', async (req, res) => {
    const order = await Order.findById(req.params.id);
    const buku = await Buku.findById(order.bukuId);
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: buku.pdfUrl });
    res.redirect('/admin');
});

app.get('/admin/del/:id', async (req, res) => {
    await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});

// --- AUTH & MISC ---
app.post('/api/order', async (req, res) => {
    const buku = await Buku.findById(req.body.bukuId);
    const o = new Order({ bukuId: req.body.bukuId, judulBuku: buku.judul, bukti: req.body.bukti });
    await o.save();
    res.json({ id: o._id });
});
app.get('/api/order-status/:id', async (req, res) => {
    const o = await Order.findById(req.params.id);
    res.json(o);
});
app.get('/login', (req, res) => { res.send('<h2>Login Admin</h2><form action="/login" method="POST"><input name="pw" type="password"><button>Login</button></form>'); });
app.post('/login', (req, res) => { if(req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

app.listen(process.env.PORT || 3000);

