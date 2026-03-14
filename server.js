const express = require('express');
const mongoose = require('mongoose');
const app = express();

// --- 1. DATABASE & CORE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 JESTRI CORE: ACTIVE")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, investasi: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah', 'Self-Dev', 'Finance'];
const ADMIN_PASS = 'JESTRI0301209';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 2. MODE PEMBELI (RESTORED TO ORIGINAL) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Digital Assets</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: white; margin: 0; overflow-x: hidden; }
        .glass { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar { transition: 0.5s transform cubic-bezier(0.16, 1, 0.3, 1); background: #0F0F11; overflow-y: auto; scrollbar-width: none; }
        .sidebar::-webkit-scrollbar { display: none; }
        .book-card { background: #161618; border-radius: 24px; transition: 0.4s; border: 1px solid rgba(255,255,255,0.03); overflow: hidden; }
        .book-card:hover { transform: translateY(-5px); border-color: #007AFF; box-shadow: 0 15px 30px rgba(0,122,255,0.15); }
        .no-scroll { overflow: hidden !important; }
    </style></head><body>

    <nav class="glass sticky top-0 z-[100] p-4 px-6 md:px-10 flex justify-between items-center">
        <div class="flex items-center gap-5">
            <i class="fa-solid fa-bars-staggered text-xl cursor-pointer hover:text-blue-500 transition" onclick="togSide(true)"></i>
            <h1 class="text-lg font-black italic uppercase tracking-tighter">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        </div>
        <button onclick="togCart(true)" class="bg-blue-600/10 p-2.5 px-6 rounded-full border border-blue-500/20 hover:bg-blue-600/20 transition">
            <i class="fa-solid fa-bag-shopping text-blue-500 text-sm"></i> <span id="cartCount" class="font-bold ml-2 text-xs">0</span>
        </button>
    </nav>

    <div id="ov" onclick="togSide(false)" class="fixed inset-0 bg-black/90 z-[110] hidden backdrop-blur-md"></div>
    <aside id="sb" class="sidebar fixed top-0 left-0 h-full w-[85%] md:w-80 z-[120] -translate-x-full p-8 flex flex-col">
        <div class="flex justify-between items-center mb-10"><span class="text-[9px] font-black tracking-widest text-gray-500 uppercase">Kategori</span><i class="fa-solid fa-xmark text-lg cursor-pointer" onclick="togSide(false)"></i></div>
        <div class="flex-grow space-y-2">
            <button onclick="setFilter('Semua')" class="w-full text-left p-4 rounded-2xl bg-white/5 font-bold hover:bg-blue-600 transition">Semua Koleksi</button>
            ${LIST_GENRE.map(g => `<button onclick="setFilter('${g}')" class="w-full text-left p-4 rounded-2xl text-gray-400 text-sm hover:text-white transition hover:bg-white/5 italic">${g}</button>`).join('')}
        </div>
        <div class="pt-10 border-t border-white/5 text-center mt-5">
            <div class="flex justify-center gap-6 mb-5 text-xl text-gray-500">
                <a href="https://wa.me/6285189415489" class="hover:text-green-500"><i class="fa-brands fa-whatsapp"></i></a>
                <a href="https://instagram.com/jesssstri" class="hover:text-pink-500"><i class="fa-brands fa-instagram"></i></a>
            </div>
            <a href="https://saweria.co/jesssstri" class="block w-full p-4 rounded-xl bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest">Donate Now</a>
        </div>
    </aside>

    <main class="max-w-7xl mx-auto px-6 py-12 md:py-20 min-h-screen">
        <header class="mb-12"><h2 id="vTitle" class="text-3xl md:text-5xl font-black mb-3 tracking-tighter">Investasi Literasi Digital.</h2><p class="text-gray-600 text-[10px] font-bold tracking-[0.4em] uppercase italic">Premium Digital Assets</p></header>
        <div id="grid" class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"></div>
    </main>

    <footer class="p-10 border-t border-white/5 text-center bg-[#0D0D0F]">
        <h1 class="text-lg font-black italic uppercase mb-4">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        <p class="text-gray-600 text-[9px] font-black tracking-widest uppercase mb-6 italic">© 2026. Premium Assets.</p>
        <div class="flex justify-center gap-5">
            <a href="https://saweria.co/jesssstri" class="text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-500/20 px-8 py-2 rounded-full">Support</a>
        </div>
    </footer>

    <div id="md" class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4">
        <div class="bg-[#111] w-full max-w-lg rounded-[2.5rem] p-8 border border-white/5 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-black mb-8 text-center italic uppercase tracking-tight">Checkout.</h3>
            <div id="cartList" class="space-y-4 mb-8"></div>
            <div class="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center mb-8">
                <img src="https://i.ibb.co.com/jP4fBvY8/Screenshot-20250304-104953-CIMB-OCTO.jpg" class="w-40 mx-auto rounded-2xl mb-4">
                <p class="text-sm font-black text-blue-500 uppercase">DANA: 0895 3278 06441</p>
            </div>
            <div class="flex justify-between font-black text-xl mb-8 px-2 italic"><span>Total</span><span id="cartTotal" class="text-blue-500">Rp 0</span></div>
            <input type="file" id="fi" class="hidden" onchange="document.getElementById('ftxt').innerText='BUKTI READY'">
            <label for="fi" id="ftxt" class="block border border-dashed border-white/10 p-5 rounded-2xl text-center cursor-pointer mb-6 text-[10px] text-gray-500 font-black uppercase">Upload Bukti Transfer</label>
            <button onclick="prosesBayar()" id="btnBayar" class="w-full bg-blue-600 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest">Beli Sekarang</button>
            <button onclick="togCart(false)" class="w-full mt-6 text-gray-700 text-[10px] font-black uppercase">Kembali</button>
        </div>
    </div>

    <script>
        let books = [], cart = [];
        async function init() { const r = await fetch('/core/books'); books = await r.json(); render('Semua'); }
        function togSide(st) { document.getElementById('sb').style.transform = st ? 'translateX(0)' : 'translateX(-100%)'; document.getElementById('ov').classList.toggle('hidden', !st); document.body.classList.toggle('no-scroll', st); }
        function setFilter(g) { document.getElementById('vTitle').innerText = g === 'Semua' ? 'Investasi Literasi Digital.' : g; render(g); togSide(false); }
        function render(g) { const grid = document.getElementById('grid'); const data = g === 'Semua' ? books : books.filter(b => b.genre === g); grid.innerHTML = data.map(b => \`<div class="book-card"><img src="\${b.gambar}" class="aspect-[3/4] object-cover w-full"><div class="p-5"><p class="text-[8px] text-blue-500 font-black mb-1 uppercase">\${b.genre}</p><h4 class="font-bold text-[12px] h-10 line-clamp-2 leading-tight mb-4">\${b.judul}</h4><div class="flex justify-between items-center pt-3 border-t border-white/5"><span class="font-black text-[14px] italic">Rp \${b.investasi.toLocaleString()}</span><button onclick="addCart('\${b._id}')" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-blue-600 transition"><i class="fa-solid fa-plus text-[10px]"></i></button></div></div></div>\`).join(''); }
        function addCart(id) { const b = books.find(x => x._id === id); if(!cart.find(x => x._id === id)) { cart.push(b); document.getElementById('cartCount').innerText = cart.length; } }
        function togCart(st) { document.getElementById('md').classList.toggle('hidden', !st); document.getElementById('md').style.display = st ? 'flex' : 'none'; if(st){ document.getElementById('cartList').innerHTML = cart.map(x=>\`<div class="flex justify-between text-[11px] font-black uppercase italic"><span>\${x.judul}</span><span class="text-blue-500">Rp \${x.investasi.toLocaleString()}</span></div>\`).join(''); document.getElementById('cartTotal').innerText = 'Rp '+cart.reduce((a,b)=>a+b.investasi,0).toLocaleString(); }}
        async function prosesBayar() { /* logic bayar */ }
        init();
    </script></body></html>`);
});

// --- 3. MODE ADMIN (RE-DESIGNED & COMPACT SIDEBAR) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; color:white; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
    <div style="background:#111; padding:40px; border-radius:30px; border:1px solid #222; width:280px; text-align:center;">
        <h2 style="font-weight:900; margin-bottom:20px; text-transform:uppercase; letter-spacing:2px; font-size:12px; color:#444;">Access Control</h2>
        <input id="pw" type="password" placeholder="Passcode" style="padding:15px; border-radius:12px; border:1px solid #333; background:#000; color:white; text-align:center; width:100%; margin-bottom:20px; outline:none; font-weight:bold;">
        <button onclick="login()" style="background:#007AFF; color:white; border:none; padding:15px; border-radius:12px; font-weight:900; cursor:pointer; width:100%; text-transform:uppercase; font-size:10px;">Login</button>
    </div>
    <script>async function login(){ const pw=document.getElementById('pw').value; const r=await fetch('/core/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pw})}); const res=await r.json(); if(res.ok){localStorage.setItem('jestri_key','AUTHORIZED');location.href='/admin';}else{alert('Denied');}}</script></body></html>`);
});

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: white; margin: 0; }
        .admin-sidebar { width: 320px; background: #0D0D0F; border-right: 1px solid #1A1A1C; height: 100vh; position: fixed; left: 0; top: 0; padding: 35px; z-index: 50; overflow-y: auto; }
        .admin-main { margin-left: 320px; padding: 40px; }
        .compact-input { background: #000; border: 1px solid #222; border-radius: 12px; padding: 12px; font-size: 12px; color: white; width: 100%; outline: none; transition: 0.3s; }
        .compact-input:focus { border-color: #007AFF; }
        @media (max-width: 1024px) { 
            .admin-sidebar { position: relative; width: 100%; height: auto; border-right: none; padding: 25px; display: flex; flex-direction: column; align-items: center; }
            .admin-main { margin-left: 0; padding: 25px; }
            .form-container { max-width: 320px; width: 100%; }
        }
    </style></head><body>
    <script>if(localStorage.getItem('jestri_key') !== 'AUTHORIZED') location.href='/login';</script>

    <aside class="admin-sidebar">
        <div class="form-container">
            <div class="flex justify-between items-center mb-8">
                <span class="text-[10px] font-black uppercase text-blue-500 italic tracking-[0.2em]">Add New Asset</span>
                <button onclick="localStorage.removeItem('jestri_key'); location.href='/login';" class="text-red-500 text-[9px] font-black uppercase">Exit</button>
            </div>
            <div class="space-y-4">
                <div><label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block">Title</label><input id="j" placeholder="..." class="compact-input"></div>
                <div><label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block">Price</label><input id="h" type="number" placeholder="..." class="compact-input"></div>
                <div><label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block">Genre</label><select id="g" class="compact-input">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select></div>
                <div><label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block">Cover</label><input type="file" id="cv" class="text-[9px] text-gray-500 file:bg-blue-600/10 file:text-blue-500 file:border-0 file:rounded-lg file:px-2 cursor-pointer"></div>
                <button onclick="saveB()" id="sb" class="w-full bg-blue-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-900/10">Publish</button>
            </div>
        </div>
    </aside>

    <main class="admin-main">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-black italic tracking-tighter uppercase mb-2">Orders Queue.</h2>
            <p class="text-[9px] text-gray-600 font-black uppercase tracking-[0.4em] mb-10 italic">System Monitor</p>
            <div id="olist" class="space-y-4"></div>
        </div>
    </main>

    <script>
        async function load(){
            const r = await fetch('/core/get-orders'); const o = await r.json();
            document.getElementById('olist').innerHTML = o.map(x => \`
                <div class="bg-[#111] p-5 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-5 items-center">
                    <img src="\${x.bukti}" class="w-20 h-32 object-cover rounded-xl shadow-2xl" onclick="window.open('\${x.bukti}')">
                    <div class="flex-grow w-full text-center md:text-left">
                        <h4 class="text-2xl font-black text-blue-500 italic">Rp \${x.total.toLocaleString()}</h4>
                        <p class="text-[9px] text-gray-500 mb-4 font-bold uppercase italic">\${x.items.map(i=>i.judul).join(' • ')}</p>
                        <div class="flex gap-2">
                            <input id="l-\${x._id}" placeholder="Link..." class="flex-grow p-2.5 bg-black border border-white/5 rounded-xl text-[10px] outline-none focus:border-blue-500">
                            <button onclick="acc('\${x._id}')" class="bg-blue-600 px-5 rounded-xl font-black text-[9px] uppercase tracking-widest">Verify</button>
                        </div>
                    </div>
                </div>\`).join('') || '<p class="text-gray-800 font-black italic uppercase">Queue Clear</p>';
        }
        async function saveB(){
            const f = document.getElementById('cv').files[0]; if(!f) return alert("Cover!");
            const btn = document.getElementById('sb'); btn.disabled = true; btn.innerText = "UPLOADING...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/core/save-buku',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const link = document.getElementById('l-'+id).value; if(!link) return alert("Link!");
            await fetch('/core/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({link}) });
            alert("Sent!"); location.reload();
        }
        load();
    </script></body></html>`);
});

// --- 4. SECURE API ---
app.post('/core/auth', (req, res) => res.json({ ok: req.body.pw === ADMIN_PASS }));
app.get('/core/books', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/core/save-buku', async (req, res) => { await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/core/order', async (req, res) => { await new Order(req.body).save(); res.json({ok:true}); });
app.get('/core/get-orders', async (req, res) => res.json(await Order.find({status:'Pending'}).sort({_id:-1})));
app.post('/core/approve/:id', async (req, res) => { await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.link }); res.json({ok:true}); });

app.listen(process.env.PORT || 3000);

