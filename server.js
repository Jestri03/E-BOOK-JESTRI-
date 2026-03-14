const express = require('express');
const mongoose = require('mongoose');
const app = express();

// --- 1. CORE SYSTEM ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 JESTRI CORE: READY")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, investasi: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah', 'Self-Dev', 'Finance'];
const ADMIN_PASS = 'JESTRI0301209';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 2. THE STORE (USER MODE) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: white; margin: 0; }
        .glass { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .book-card { background: #161618; border-radius: 24px; transition: 0.4s; border: 1px solid rgba(255,255,255,0.03); overflow: hidden; }
        .book-card:hover { transform: translateY(-5px); border-color: #007AFF; }
    </style></head><body>
    <nav class="glass sticky top-0 z-50 p-5 flex justify-between items-center px-6 md:px-10">
        <h1 class="text-xl font-black italic uppercase tracking-tighter">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        <button onclick="alert('Keranjang')" class="bg-blue-600/10 p-2.5 px-6 rounded-full border border-blue-500/20 text-blue-500 font-bold">Cart</button>
    </nav>
    <main class="max-w-7xl mx-auto p-6 md:p-10">
        <h2 class="text-4xl md:text-6xl font-black mb-10 tracking-tighter italic">Investasi Literasi Digital.</h2>
        <div id="grid" class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"></div>
    </main>
    <script>
        async function load() {
            const r = await fetch('/core/books'); const b = await r.json();
            document.getElementById('grid').innerHTML = b.map(x => \`
                <div class="book-card">
                    <img src="\${x.gambar}" class="aspect-[3/4] object-cover w-full">
                    <div class="p-5">
                        <p class="text-[8px] text-blue-500 font-black uppercase mb-1">\${x.genre}</p>
                        <h4 class="font-bold text-xs h-10 line-clamp-2 mb-4">\${x.judul}</h4>
                        <div class="flex justify-between items-center"><span class="font-black italic text-sm">Rp \${x.investasi.toLocaleString()}</span><button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-blue-600 transition"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                    </div>
                </div>\`).join('');
        }
        load();
    </script></body></html>`);
});

// --- 3. THE COMMAND CENTER (ADMIN MODE) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; color:white; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; margin:0;">
    <div style="text-align:center; background:#111; padding:40px; border-radius:30px; border:1px solid #222; width:280px;">
        <h2 style="font-weight:900; margin-bottom:20px; text-transform:uppercase; letter-spacing:3px; font-size:12px; color:#555;">Elite Access</h2>
        <input id="pw" type="password" placeholder="Passcode" onkeypress="if(event.key==='Enter') login()" style="padding:15px; border-radius:12px; border:1px solid #333; background:#000; color:white; text-align:center; width:100%; margin-bottom:20px; outline:none; font-weight:bold;">
        <button onclick="login()" style="background:#007AFF; color:white; border:none; padding:15px; border-radius:12px; font-weight:900; cursor:pointer; width:100%; text-transform:uppercase; font-size:10px;">Auth</button>
    </div>
    <script>async function login(){const pw=document.getElementById('pw').value;const r=await fetch('/core/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pw})});const res=await r.json();if(res.ok){localStorage.setItem('jestri_key','AUTHORIZED');location.href='/admin';}else{alert('Denied');}}</script></body></html>`);
});

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: white; margin: 0; }
        .admin-sidebar { width: 340px; background: #0D0D0F; border-right: 1px solid #1A1A1C; height: 100vh; position: fixed; left: 0; top: 0; z-index: 50; padding: 40px; }
        .admin-main { margin-left: 340px; padding: 50px; }
        .compact-input { background: #000; border: 1px solid #1A1A1C; border-radius: 12px; padding: 12px; font-size: 12px; color: white; width: 100%; outline: none; transition: 0.3s; }
        .compact-input:focus { border-color: #007AFF; }
        
        @media (max-width: 1024px) {
            .admin-sidebar { position: relative; width: 100%; height: auto; border-right: none; padding: 25px; display: flex; flex-direction: column; align-items: center; }
            .admin-main { margin-left: 0; padding: 25px; }
            .form-box { max-width: 340px; width: 100%; }
        }
    </style></head><body>
    <script>if(localStorage.getItem('jestri_key') !== 'AUTHORIZED') location.href='/login';</script>

    <aside class="admin-sidebar">
        <div class="form-box">
            <div class="flex justify-between items-center mb-10">
                <span class="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">Command Center</span>
                <button onclick="localStorage.removeItem('jestri_key'); location.href='/login';" class="text-red-500 text-[10px] font-black uppercase">Exit</button>
            </div>
            
            <h3 class="text-xl font-black italic tracking-tighter mb-6">PUBLISH ASSET.</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block ml-1">Title</label>
                    <input id="j" placeholder="Asset Name..." class="compact-input">
                </div>
                <div>
                    <label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block ml-1">Investment</label>
                    <input id="h" type="number" placeholder="Rp..." class="compact-input">
                </div>
                <div>
                    <label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block ml-1">Category</label>
                    <select id="g" class="compact-input">
                        ${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block ml-1">Cover Asset</label>
                    <input type="file" id="cv" class="text-[9px] text-gray-500 file:bg-blue-600/10 file:text-blue-500 file:border-0 file:rounded-lg file:px-3 file:py-1 cursor-pointer">
                </div>
                <button onclick="saveB()" id="sb" class="w-full bg-blue-600 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition shadow-lg shadow-blue-900/10 mt-4">Publish Now</button>
            </div>
        </div>
    </aside>

    <main class="admin-main">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-4xl font-black italic tracking-tighter uppercase mb-2">Queue.</h2>
            <p class="text-[9px] text-gray-600 font-black uppercase tracking-[0.4em] mb-12 italic">Order Monitoring System</p>
            
            <div id="olist" class="space-y-6"></div>
        </div>
    </main>

    <script>
        async function load(){
            const r = await fetch('/core/get-orders'); const o = await r.json();
            document.getElementById('olist').innerHTML = o.map(x => \`
            <div class="bg-[#111] p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row gap-6 items-center">
                <img src="\${x.bukti}" class="w-24 h-36 object-cover rounded-xl shadow-2xl" onclick="window.open('\${x.bukti}')">
                <div class="flex-grow w-full">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="text-2xl font-black text-blue-500 italic">Rp \${x.total.toLocaleString()}</h4>
                        <span class="text-[9px] text-gray-500 font-black italic">PENDING</span>
                    </div>
                    <p class="text-[10px] text-gray-400 mb-6 font-medium">\${x.items.map(i=>i.judul).join(' • ')}</p>
                    <div class="flex gap-2">
                        <input id="l-\${x._id}" placeholder="Link Mediafire..." class="flex-grow p-3 bg-black border border-white/5 rounded-xl text-[11px] outline-none focus:border-blue-500">
                        <button onclick="acc('\${x._id}')" class="bg-blue-600 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500">Verify</button>
                    </div>
                </div>
            </div>\`).join('') || '<p class="text-gray-800 font-black italic uppercase">No Activity Detected</p>';
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

// --- 4. SECURE CORE API ---
app.post('/core/auth', (req, res) => res.json({ ok: req.body.pw === ADMIN_PASS }));
app.get('/core/books', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/core/save-buku', async (req, res) => { await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/core/order', async (req, res) => { await new Order(req.body).save(); res.json({ok:true}); });
app.get('/core/get-orders', async (req, res) => res.json(await Order.find({status:'Pending'}).sort({_id:-1})));
app.post('/core/approve/:id', async (req, res) => { await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.link }); res.json({ok:true}); });

app.listen(process.env.PORT || 3000);

