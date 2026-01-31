const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- KONEKSI DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String, rating: {type: Number, default: 5} });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];

// Body Parser dengan limit stabil
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieSession({ name: 'jestri_session', keys: ['JESTRI_PRIVATE_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (SESUAI REFERENSI PROFESIONAL) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jestri Store | Beli & Unduh E-Book Premium</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        :root { --primary: #0B4D74; --secondary: #F59E0B; --bg: #F8FAFC; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: #0F172A; }
        h1, h2, h3 { font-family: 'Poppins', sans-serif; }
        .glass { background: rgba(11, 77, 116, 0.98); backdrop-filter: blur(10px); }
        .product-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .product-card:hover { transform: translateY(-8px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .sidebar-anim { transition: transform 0.4s ease; }
        .btn-amber { background: var(--secondary); color: #fff; transition: 0.2s; }
        .btn-amber:hover { background: #d97706; transform: scale(1.05); }
    </style></head><body class="pb-20">

    <div id="ov" onclick="tog()" class="fixed inset-0 bg-black/50 z-[4500] hidden backdrop-blur-sm"></div>
    <aside id="sb" class="fixed top-0 left-0 h-full w-72 bg-[#0F172A] z-[5000] sidebar-anim -translate-x-full p-6 text-white">
        <div class="flex justify-between items-center mb-10">
            <h2 class="text-2xl font-black text-amber-400 italic">JESTRI.</h2>
            <i class="fa-solid fa-xmark text-2xl cursor-pointer" onclick="tog()"></i>
        </div>
        <p class="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Kategori Utama</p>
        <div class="space-y-2">
            <div onclick="setG('Semua', this)" class="p-3 rounded-xl cursor-pointer hover:bg-white/10 active-g font-bold bg-amber-500/10">Semua E-Book</div>
            ${LIST_GENRE.map(g => `<div onclick="setG('${g}', this)" class="p-3 rounded-xl cursor-pointer hover:bg-white/10 transition">${g}</div>`).join('')}
        </div>
        <div class="mt-20">
            <a href="https://link.dana.id/qr/0895327806441" class="block w-full bg-[#4c1d95] p-4 rounded-2xl text-center font-bold shadow-lg shadow-purple-900/40">
                <i class="fa-solid fa-heart mr-2 text-red-400"></i>Donasi Admin
            </a>
        </div>
    </aside>

    <header class="glass sticky top-0 z-40 text-white p-4 px-6 shadow-xl">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-4">
                <i class="fa-solid fa-bars-staggered text-xl cursor-pointer" onclick="tog()"></i>
                <h1 class="text-xl font-extrabold tracking-tighter">JESTRI<span class="text-amber-400">STORE</span></h1>
            </div>
            <div class="relative cursor-pointer bg-white/10 p-2 px-3 rounded-full" onclick="openCart()">
                <i class="fa-solid fa-bag-shopping text-lg"></i>
                <span id="cc" class="ml-2 font-black text-amber-400">0</span>
            </div>
        </div>
    </header>

    <section class="p-6 max-w-6xl mx-auto">
        <div class="bg-gradient-to-br from-[#0B4D74] to-[#1e293b] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div class="relative z-10 max-w-md">
                <h2 class="text-3xl font-bold leading-tight mb-3">Temukan E-Book Terbaik & Terlengkap</h2>
                <p class="text-blue-100/70 text-sm mb-6">Preview gratis — Beli & unduh dalam hitungan menit tanpa ribet.</p>
                <button class="bg-amber-500 p-3 px-6 rounded-xl font-bold text-sm shadow-lg">Jelajahi Sekarang</button>
            </div>
            <i class="fa-solid fa-book-bookmark absolute -right-6 -bottom-6 text-[12rem] text-white/5 rotate-12"></i>
        </div>
    </section>

    <main class="max-w-6xl mx-auto px-6 mt-4">
        <div class="flex justify-between items-center mb-8 border-l-4 border-amber-400 pl-4">
            <h3 id="gt" class="text-2xl font-extrabold text-slate-800">Semua Koleksi</h3>
        </div>
        <div id="grid" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
    </main>

    <div id="proof" class="fixed bottom-24 left-6 bg-white p-3 rounded-2xl shadow-2xl flex items-center gap-3 z-40 translate-y-40 transition-all duration-500 border border-slate-100">
        <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold">J</div>
        <div class="text-[11px]">
            <p class="text-gray-500 leading-none">Seseorang baru saja membeli</p>
            <p id="pBook" class="font-bold text-slate-800 truncate w-32"></p>
        </div>
    </div>

    <div class="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <a href="https://wa.me/6285189415489" class="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl text-2xl"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://instagram.com/jesssstri" class="w-14 h-14 bg-gradient-to-tr from-orange-400 via-red-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl text-2xl"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="md" class="fixed inset-0 z-[6000] bg-black/80 hidden items-center justify-center p-4">
        <div class="bg-white w-full max-w-md rounded-[2rem] p-8 relative overflow-hidden">
            <h3 class="text-2xl font-black mb-1 text-[#0B4D74]">Selesaikan Pesanan</h3>
            <p class="text-xs text-gray-400 mb-6 font-semibold">TRANSFER SESUAI TOTAL KE DANA/QRIS ADMIN</p>
            <div id="cl" class="max-h-52 overflow-auto space-y-3 mb-6 pr-2"></div>
            <div class="flex justify-between items-center py-4 border-t-2 border-slate-50 mb-4">
                <span class="font-bold text-slate-400">Total Harga</span>
                <span id="ct" class="text-2xl font-black text-amber-500">Rp 0</span>
            </div>
            <label class="block bg-slate-100 p-4 rounded-2xl cursor-pointer text-center text-xs font-bold text-slate-600 hover:bg-slate-200 border-2 border-dashed border-slate-300">
                <i class="fa-solid fa-upload mr-2"></i> UPLOAD BUKTI TRANSFER
                <input type="file" id="fup" class="hidden" onchange="this.parentElement.innerText='✅ BUKTI SIAP!'">
            </label>
            <button onclick="pay()" id="btnP" class="w-full bg-[#0B4D74] text-white py-5 rounded-2xl mt-6 font-black text-lg shadow-xl active:scale-95 transition">BAYAR SEKARANG</button>
        </div>
    </div>

    <script>
        let allB = [], cart = [];
        async function load(){
            const r = await fetch('/api/buku-json'); allB = await r.json();
            render(allB); startProof();
        }
        function tog(){ document.getElementById('sb').classList.toggle('-translate-x-full'); document.getElementById('ov').classList.toggle('hidden'); }
        function render(data){
            document.getElementById('grid').innerHTML = data.map(b => \`
                <div class="product-card bg-white rounded-[2rem] overflow-hidden flex flex-col h-full border border-slate-100 shadow-sm">
                    <img src="\${b.gambar}" class="w-full aspect-[3/4] object-cover" loading="lazy">
                    <div class="p-5 flex-grow flex flex-col">
                        <h4 class="font-bold text-sm text-slate-800 line-clamp-2 mb-1 h-10">\${b.judul}</h4>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-4">By \${b.penulis}</p>
                        <div class="mt-auto flex items-center justify-between">
                            <span class="font-black text-blue-900 text-sm italic">Rp \${b.harga.toLocaleString()}</span>
                            <button onclick="add('\${b._id}')" class="w-10 h-10 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-90 transition">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>\`).join('');
        }
        function add(id){
            const b = allB.find(x=>x._id===id); if(!cart.find(x=>x._id===id)) cart.push(b);
            document.getElementById('cc').innerText = cart.length;
        }
        function setG(g, el){
            document.getElementById('gt').innerText = g;
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g)); tog();
        }
        function openCart(){
            if(!cart.length) return alert("Pilih buku dulu bos!");
            document.getElementById('md').style.display = 'flex';
            document.getElementById('cl').innerHTML = cart.map(x => \`<div class="flex justify-between text-sm font-bold border-b border-slate-50 pb-2"><span>\${x.judul}</span><span class="text-amber-500">Rp \${x.harga.toLocaleString()}</span></div>\`).join('');
            document.getElementById('ct').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.harga,0).toLocaleString();
        }
        async function pay(){
            const f = document.getElementById('fup').files[0]; if(!f) return alert("Upload bukti transfer!");
            const btn = document.getElementById('btnP'); btn.disabled = true; btn.innerText = "PROSES...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items:cart, total:cart.reduce((a,b)=>a+b.harga,0), bukti:up.secure_url}) });
            const data = await res.json();
            document.getElementById('md').innerHTML = \`<div class="text-center py-10"><i class="fa-solid fa-circle-check text-6xl text-green-500 mb-4"></i><h3 class="text-xl font-black">Pesanan Berhasil!</h3><p class="text-sm text-gray-500 mt-2">Admin sedang cek pembayaranmu. Link download akan muncul otomatis di sini.</p><div id="dlBox" class="mt-8">⌛ Menunggu Verifikasi Admin...</div></div>\`;
            setInterval(async () => {
                const rs = await fetch('/api/check/'+data.id); const st = await rs.json();
                if(st.status === 'Approved') document.getElementById('dlBox').innerHTML = \`<a href="\${st.pdfLink}" download class="block w-full bg-green-600 text-white p-5 rounded-2xl font-black shadow-xl">DOWNLOAD E-BOOK PDF</a>\`;
            }, 5000);
        }
        function startProof(){
            const p = document.getElementById('proof');
            setInterval(() => {
                document.getElementById('pBook').innerText = allB[Math.floor(Math.random()*allB.length)].judul;
                p.classList.remove('translate-y-40');
                setTimeout(() => p.classList.add('translate-y-40'), 4000);
            }, 12000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin:0; background:#1e293b; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; }
        .box { background:rgba(255,255,255,0.05); padding:40px; border-radius:20px; text-align:center; color:white; border:1px solid rgba(255,255,255,0.1); width:80%; max-width:350px; }
        input { width:100%; padding:15px; border-radius:10px; border:none; margin-top:20px; text-align:center; }
        button { width:100%; padding:15px; border-radius:10px; border:none; background:#0ea5e9; color:white; font-weight:bold; margin-top:15px; cursor:pointer; }
    </style></head><body>
    <form class="box" action="/login" method="POST">
        <h2 style="margin:0">ADMIN PANEL</h2>
        <input name="pw" type="password" placeholder="Passcode">
        <button type="submit">ENTER SYSTEM</button>
    </form></body></html>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN PROFESIONAL ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    </head><body class="bg-slate-50 p-6 font-sans">
    <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-10">
            <h1 class="text-2xl font-black text-slate-800">Jestri Manager</h1>
            <a href="/" class="text-blue-600 font-bold">Ke Toko</a>
        </div>

        <div class="bg-white p-8 rounded-[2rem] shadow-sm mb-10 border border-slate-200">
            <h3 class="text-lg font-bold mb-4">Post E-Book Baru</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input id="j" placeholder="Judul" class="p-4 bg-slate-50 rounded-xl outline-none">
                <input id="p" placeholder="Penulis" class="p-4 bg-slate-50 rounded-xl outline-none">
                <input id="h" type="number" placeholder="Harga" class="p-4 bg-slate-50 rounded-xl outline-none">
                <select id="g" class="p-4 bg-slate-50 rounded-xl outline-none">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
            </div>
            <input type="file" id="fi" class="mt-4 block w-full text-xs text-slate-400">
            <button onclick="addB()" id="btnS" class="w-full bg-slate-800 text-white py-4 rounded-xl mt-6 font-bold uppercase tracking-widest">Publikasikan</button>
        </div>

        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2"><i class="fa-solid fa-clock-rotate-left"></i> Pesanan Menunggu (${o.length})</h3>
        <div class="space-y-4 mb-10">
            ${o.map(x => `
                <div class="bg-white p-6 rounded-[2rem] border-l-8 border-blue-500 shadow-sm flex flex-col md:flex-row justify-between items-center">
                    <div class="mb-4 md:mb-0 text-center md:text-left">
                        <b class="text-lg block text-slate-800">Rp ${x.total.toLocaleString()}</b>
                        <a href="${x.bukti}" target="_blank" class="text-xs text-blue-500 font-bold underline">Cek Bukti Transfer</a>
                    </div>
                    <div class="flex flex-col gap-2 w-full md:w-auto">
                        <input type="file" id="pdf-${x._id}" class="text-[10px]">
                        <button onclick="acc('${x._id}')" class="bg-green-600 text-white px-6 py-3 rounded-xl font-bold">APPROVE & KIRIM PDF</button>
                    </div>
                </div>`).join('') || '<p class="text-gray-400 italic">Antrean kosong.</p>'}
        </div>

        <h3 class="font-bold text-slate-800 mb-4">Daftar Katalog</h3>
        <div class="bg-white rounded-[2rem] overflow-hidden border border-slate-200">
            ${b.map(x => `
                <div class="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition">
                    <div class="flex items-center gap-4">
                        <img src="${x.gambar}" class="w-10 h-10 rounded-lg object-cover">
                        <span class="font-bold text-sm text-slate-700">${x.judul}</span>
                    </div>
                    <button onclick="delB('${x._id}')" class="text-red-500 p-2"><i class="fa-solid fa-trash-can"></i></button>
                </div>`).join('')}
        </div>
    </div>

    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "UPLOADING..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Upload PDF-nya dulu!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delB(id){ if(confirm('Hapus buku?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

