const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DB CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieSession({ name: 'jestri_v12', keys: ['SECRET_JESTRI'], maxAge: 24 * 60 * 60 * 1000 }));

// --- [ BAGIAN PEMBELI TETAP SAMA SEPERTI SEBELUMNYA ] ---
// (Gue singkat di sini untuk fokus ke perbaikan Admin, pastikan lo tetep pakai route '/' yang lengkap dari kode sebelumnya)

// --- 2. LOGIN ADMIN (DESAIN RAPI) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#f1f5f9; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:'Segoe UI',sans-serif;">
    <form action="/login" method="POST" style="background:white; padding:40px; border-radius:24px; width:340px; box-shadow:0 10px 25px rgba(0,0,0,0.05); text-align:center;">
        <div style="background:#0f172a; width:60px; height:60px; border-radius:15px; margin:0 auto 20px; display:flex; align-items:center; justify-content:center; color:#38bdf8; font-size:1.5rem;"><i class="fa-solid fa-lock"></i></div>
        <h2 style="margin:0; color:#0f172a;">Admin Login</h2>
        <p style="color:#64748b; font-size:0.9rem; margin:10px 0 25px;">Masukkan passcode untuk akses panel</p>
        <input name="pw" type="password" placeholder="••••••" autofocus style="width:100%; padding:15px; border:2px solid #e2e8f0; border-radius:12px; text-align:center; font-size:1.2rem; outline:none; transition:0.3s;" onfocus="this.style.borderColor='#38bdf8'">
        <button style="width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:bold; margin-top:20px; cursor:pointer;">MASUK SEKARANG</button>
    </form></body>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (FULL REDESIGN - RAPI & MODERN) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    const listOrder = o.map(x => `
        <div style="background:white; padding:20px; border-radius:16px; margin-bottom:15px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="background:#fef3c7; color:#92400e; padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:700;">PENDING</span>
                <b style="font-size:1.1rem; color:#0f172a;">Rp ${x.total.toLocaleString()}</b>
            </div>
            <a href="${x.bukti}" target="_blank" style="text-decoration:none; color:#38bdf8; font-size:0.85rem; font-weight:600;"><i class="fa-solid fa-image"></i> Lihat Bukti Transfer</a>
            <div style="background:#f8fafc; padding:12px; border-radius:12px; border:1px dashed #cbd5e1;">
                <label style="font-size:0.75rem; font-weight:700; color:#64748b; display:block; margin-bottom:8px;">UPLOAD FILE PDF UNTUK PEMBELI:</label>
                <input type="file" id="pdf-${x._id}" style="font-size:0.8rem;">
            </div>
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px; margin-top:5px;">
                <button onclick="acc('${x._id}')" style="padding:12px; background:#10b981; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">SETUJUI & KIRIM</button>
                <button onclick="delO('${x._id}')" style="padding:12px; background:#fee2e2; color:#ef4444; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">TOLAK</button>
            </div>
        </div>`).join('');

    const listBuku = b.map(x => `
        <div style="display:flex; align-items:center; gap:12px; padding:12px; background:white; border-radius:12px; margin-bottom:10px; border:1px solid #f1f5f9;">
            <img src="${x.gambar}" style="width:40px; height:50px; object-fit:cover; border-radius:6px;">
            <div style="flex-grow:1;">
                <div style="font-weight:700; font-size:0.9rem; color:#0f172a;">${x.judul}</div>
                <div style="font-size:0.75rem; color:#64748b;">Rp ${x.harga.toLocaleString()}</div>
            </div>
            <button onclick="delB('${x._id}')" style="color:#ef4444; background:none; border:none; font-size:1.1rem; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).join('');

    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#f8fafc; color:#0f172a; margin:0; padding:20px; }
        .header-panel { display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; }
        .section-title { font-size:1.1rem; font-weight:800; margin:20px 0 15px; display:flex; align-items:center; gap:10px; }
        .card-input { background:white; padding:25px; border-radius:24px; box-shadow:0 4px 15px rgba(0,0,0,0.02); border:1px solid #e2e8f0; }
        input, select { width:100%; padding:12px 15px; margin-bottom:12px; border:1px solid #e2e8f0; border-radius:12px; outline:none; transition:0.3s; font-size:0.9rem; }
        input:focus { border-color:#38bdf8; box-shadow:0 0 0 4px rgba(56,189,248,0.1); }
        .btn-post { width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:800; font-size:1rem; cursor:pointer; box-shadow:0 10px 20px rgba(15,23,42,0.1); }
        .badge-count { background:#38bdf8; color:white; padding:2px 8px; border-radius:8px; font-size:0.7rem; }
    </style></head><body>
    
    <div class="header-panel">
        <div><h2 style="margin:0;">Dashboard</h2><p style="margin:0; font-size:0.8rem; color:#64748b;">Halo Admin Jestri!</p></div>
        <a href="/" style="text-decoration:none; color:#0f172a; font-weight:700; font-size:0.9rem;"><i class="fa-solid fa-house"></i> Lihat Toko</a>
    </div>

    <div class="card-input">
        <div class="section-title" style="margin-top:0;"><i class="fa-solid fa-plus-circle" style="color:#38bdf8;"></i> Tambah Produk</div>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Penulis">
        <input id="h" type="number" placeholder="Harga Jual (Rp)">
        <select id="g">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <div style="padding:10px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:12px;">
            <label style="font-size:0.75rem; color:#64748b; font-weight:700;">UPLOAD COVER:</label>
            <input type="file" id="fi" style="margin:5px 0 0; border:none; padding:0;">
        </div>
        <button onclick="addB()" id="btnS" class="btn-post">POSTING SEKARANG</button>
    </div>

    <div class="section-title"><i class="fa-solid fa-bell" style="color:#fbbf24;"></i> Pesanan Masuk <span class="badge-count">${o.length}</span></div>
    <div>${listOrder || '<p style="color:#94a3b8; text-align:center; font-size:0.9rem;">Belum ada pesanan pending</p>'}</div>

    <div class="section-title"><i class="fa-solid fa-book" style="color:#38bdf8;"></i> Katalog Buku <span class="badge-count">${b.length}</span></div>
    <div style="margin-bottom:50px;">${listBuku}</div>

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
        async function delO(id){ if(confirm('Tolak pesanan ini?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        async function delB(id){ if(confirm('Hapus buku ini?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- [ API ROUTES LANJUTAN TETAP SAMA ] ---
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

