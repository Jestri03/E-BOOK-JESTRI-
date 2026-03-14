const express = require('express');
const mongoose = require('mongoose');
const app = express();

// --- 1. CORE SYSTEM & DB ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 JESTRI CORE: ONLINE")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, investasi: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah', 'Self-Dev', 'Finance'];
const ADMIN_PASS = 'JESTRI0301209';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 2. FRONTEND (Simplified Render for Speed) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Digital Literacy</title>
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
        <button onclick="togCart(true)" class="bg-blue-600/10 p-2.5 px-6 rounded-full border border-blue-500/20"><i class="fa-solid fa-bag-shopping text-blue-500"></i> <span id="cartCount" class="font-bold ml-2 text-xs">0</span></button>
    </nav>
    <div id="ov" onclick="togSide(false)" class="fixed inset-0 bg-black/90 z-[110] hidden backdrop-blur-md"></div>
    <aside id="sb" class="sidebar fixed top-0 left-0 h-full w-[85%] md:w-80 z-[120] -translate-x-full p-8 flex flex-col">
        <div class="flex justify-between items-center mb-10"><span class="text-[9px] font-black tracking-widest text-gray-500 uppercase">Kategori</span><i class="fa-solid fa-xmark text-lg cursor-pointer" onclick="togSide(false)"></i></div>
        <div class="flex-grow space-y-2">
            <button onclick="setFilter('Semua')" class="w-full text-left p-4 rounded-2xl bg-white/5 font-bold hover:bg-blue-600 transition">Semua</button>
            ${LIST_GENRE.map(g => `<button onclick="setFilter('${g}')" class="w-full text-left p-4 rounded-2xl text-gray-400 text-sm hover:text-white transition hover:bg-white/5 italic">${g}</button>`).join('')}
        </div>
    </aside>
    <main class="max-w-7xl mx-auto px-6 py-12 md:py-20"><header class="mb-12 md:mb-16"><h2 id="vTitle" class="text-3xl md:text-5xl font-black mb-3 tracking-tighter">Investasi Literasi Digital.</h2><p class="text-gray-600 text-[10px] font-bold tracking-[0.4em] uppercase italic">Premium Digital Assets</p></header><div id="grid" class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"></div></main>
    <script>
        let books = [], cart = [];
        async function init() { const r = await fetch('/core/books'); books = await r.json(); render('Semua'); }
        function togSide(st) { document.getElementById('sb').style.transform = st ? 'translateX(0)' : 'translateX(-100%)'; document.getElementById('ov').classList.toggle('hidden', !st); document.body.classList.toggle('no-scroll', st); }
        function setFilter(g) { document.getElementById('vTitle').innerText = g === 'Semua' ? 'Investasi Literasi Digital.' : g; render(g); togSide(false); }
        function render(g) { const grid = document.getElementById('grid'); const data = g === 'Semua' ? books : books.filter(b => b.genre === g); grid.innerHTML = data.map(b => \`<div class="book-card"><div class="aspect-[3/4] bg-[#1e1e20]"><img src="\${b.gambar}" class="w-full h-full object-cover"></div><div class="p-5"><p class="text-[8px] text-blue-500 font-black mb-1 uppercase">\${b.genre}</p><h4 class="font-bold text-[12px] h-10 line-clamp-2 leading-tight mb-4">\${b.judul}</h4><div class="flex justify-between items-center pt-3 border-t border-white/5"><span class="font-black text-[14px] italic">Rp \${b.investasi.toLocaleString()}</span><button onclick="addCart('\${b._id}')" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-blue-600 transition"><i class="fa-solid fa-plus text-[10px]"></i></button></div></div></div>\`).join(''); }
        function addCart(id) { const b = books.find(x => x._id === id); if(!cart.find(x => x._id === id)) { cart.push(b); document.getElementById('cartCount').innerText = cart.length; } }
        init();
    </script></body></html>`);
});

// --- 3. THE MASTER ADMIN INTERFACE (COMPACT & PRO) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; color:white; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
    <div style="text-align:center; background:#111; padding:50px; border-radius:40px; border:1px solid #222; width:320px;">
        <h2 style="font-weight:900; margin-bottom:30px; text-transform:uppercase; letter-spacing:4px; font-size:12px; color:#555;">Elite Access</h2>
        <input id="pw" type="password" placeholder="Passcode" onkeypress="if(event.key==='Enter') login()" style="padding:18px; border-radius:20px; border:1px solid #333; background:#000; color:white; text-align:center; width:100%; margin-bottom:20px; outline:none; font-weight:bold; font-size:18px;">
        <button onclick="login()" style="background:#007AFF; color:white; border:none; padding:18px; border-radius:20px; font-weight:900; cursor:pointer; width:100%; text-transform:uppercase; font-size:11px;">Unlock</button>
    </div>
    <script>
        async function login(){
            const pw = document.getElementById('pw').value;
            const r = await fetch('/core/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pw}) });
            const res = await r.json();
            if(res.ok) { localStorage.setItem('jestri_key', 'AUTHORIZED'); location.href='/admin'; }
            else { alert('Access Denied'); }
        }
    </script></body></html>`);
});

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: white; margin: 0; }
        .admin-sidebar { width: 320px; background: #111; border-right: 1px solid rgba(255,255,255,0.05); height: 100vh; position: fixed; left: 0; top: 0; overflow-y: auto; z-index: 50; }
        .admin-main { margin-left: 320px; padding: 40px; min-height: 100vh; }
        .compact-input { background: #000; border: 1px solid #222; border-radius: 12px; padding: 12px; font-size: 12px; color: white; width: 100%; outline: none; transition: 0.3s; }
        .compact-input:focus { border-color: #007AFF; }
        @media (max-width: 1024px) { 
            .admin-sidebar { position: relative; width: 100%; height: auto; border-right: none; border-bottom: 1px solid #222; }
            .admin-main { margin-left: 0; padding: 20px; }
        }
    </style></head>
    <body>
        <script>if(localStorage.getItem('jestri_key') !== 'AUTHORIZED') location.href='/login';</script>
        
        <aside class="admin-sidebar p-8">
            <div class="flex justify-between items-center mb-10">
                <h1 class="text-sm font-black italic uppercase tracking-widest text-blue-500">Add Asset</h1>
                <button onclick="localStorage.removeItem('jestri_key'); location.href='/login';" class="text-[9px] text-red-500 font-black uppercase">Logout</button>
            </div>

            <div class="space-y-6">
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] text-gray-500 font-black uppercase mb-2 block">Judul Asset</label>
                        <input id="j" placeholder="Judul e-book..." class="compact-input">
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-500 font-black uppercase mb-2 block">Harga</label>
                        <input id="h" type="number" placeholder="Nominal..." class="compact-input">
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-500 font-black uppercase mb-2 block">Kategori</label>
                        <select id="g" class="compact-input">
                            ${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-500 font-black uppercase mb-2 block">Cover</label>
                        <input type="file" id="cv" class="text-[10px] text-gray-500 file:bg-blue-600/10 file:text-blue-500 file:border-0 file:rounded-lg file:px-3 file:py-1 cursor-pointer">
                    </div>
                    <button onclick="saveB()" id="sb" class="w-full bg-blue-600 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition">Publish</button>
                </div>
                
                <div class="pt-8 border-t border-white/5">
                    <p class="text-[9px] text-gray-600 font-bold uppercase tracking-widest">System Status</p>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span class="text-[10px] font-black italic">DATABASE READY</span>
                    </div>
                </div>
            </div>
        </aside>

        <main class="admin-main">
            <div class="max-w-4xl mx-auto">
                <div class="mb-10 flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-black tracking-tighter italic uppercase">Orders.</h2>
                        <p class="text-[10px] text-gray-600 font-black tracking-[0.3em] uppercase italic">Real-time Transaction</p>
                    </div>
                    <a href="/" class="text-[10px] font-black text-gray-500 border border-white/5 px-4 py-2 rounded-full hover:bg-white/5">View Store</a>
                </div>

                <div id="olist" class="space-y-6">
                    </div>
            </div>
        </main>

        <script>
            async function load(){
                const r = await fetch('/core/get-orders'); const o = await r.json();
                document.getElementById('olist').innerHTML = o.map(x => \`
                <div class="bg-[#111] p-6 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-6 items-center group hover:border-blue-500/30 transition duration-500">
                    <img src="\${x.bukti}" class="w-24 md:w-32 h-44 object-cover rounded-2xl border border-white/5 shadow-2xl group-hover:scale-105 transition duration-500" onclick="window.open('\${x.bukti}')">
                    <div class="flex-grow w-full">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="text-2xl font-black text-blue-500 italic tracking-tighter">Rp \${x.total.toLocaleString()}</h4>
                            <span class="text-[8px] bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">Pending</span>
                        </div>
                        <p class="text-[9px] text-gray-500 mb-6 uppercase tracking-widest font-bold italic">\${x.items.map(i=>i.judul).join(' • ')}</p>
                        <div class="flex flex-col md:flex-row gap-2">
                            <input id="l-\${x._id}" placeholder="Input Download Link..." class="flex-grow p-3 bg-black border border-white/5 rounded-xl text-[11px] outline-none focus:border-blue-500 transition">
                            <button onclick="acc('\${x._id}')" class="bg-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition">Verify</button>
                        </div>
                    </div>
                </div>\`).join('') || '<div class="py-20 text-center text-gray-800 font-black uppercase tracking-[0.5em] italic">Queue Empty</div>';
            }
            async function saveB(){
                const f = document.getElementById('cv').files[0]; if(!f) return alert("Cover missing");
                const btn = document.getElementById('sb'); btn.disabled = true; btn.innerText = "PROCESSING...";
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                try {
                    const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                    await fetch('/core/save-buku',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                    location.reload();
                } catch(e) { alert("Failed"); btn.disabled = false; btn.innerText = "Publish"; }
            }
            async function acc(id){
                const link = document.getElementById('l-'+id).value; if(!link) return alert("Link required");
                await fetch('/core/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({link}) });
                alert("Success"); location.reload();
            }
            load();
        </script>
    </body></html>`);
});

// --- 4. SECURE CORE API ---
app.post('/core/auth', (req, res) => {
    res.json({ ok: req.body.pw === ADMIN_PASS });
});

app.get('/core/books', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/core/save-buku', async (req, res) => { await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/core/order', async (req, res) => { await new Order(req.body).save(); res.json({ok:true}); });
app.get('/core/get-orders', async (req, res) => res.json(await Order.find({status:'Pending'}).sort({_id:-1})));
app.post('/core/approve/:id', async (req, res) => { await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.link }); res.json({ok:true}); });

app.listen(process.env.PORT || 3000);

