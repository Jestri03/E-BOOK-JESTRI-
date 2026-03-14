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

// --- 2. FRONTEND (Simplified) ---
app.get('/', (req, res) => {
    // Kode frontend tetap sama seperti sebelumnya (fokus perbaikan pada Admin)
    res.redirect('/admin'); 
});

// --- 3. THE ULTRA-COMPACT ADMIN INTERFACE ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; color:white; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; margin:0;">
    <div style="text-align:center; background:#111; padding:40px; border-radius:30px; border:1px solid #222; width:280px;">
        <h2 style="font-weight:900; margin-bottom:20px; text-transform:uppercase; letter-spacing:3px; font-size:12px; color:#555;">Gate Access</h2>
        <input id="pw" type="password" placeholder="Passcode" onkeypress="if(event.key==='Enter') login()" style="padding:15px; border-radius:12px; border:1px solid #333; background:#000; color:white; text-align:center; width:100%; margin-bottom:20px; outline:none; font-weight:bold;">
        <button onclick="login()" style="background:#007AFF; color:white; border:none; padding:15px; border-radius:12px; font-weight:900; cursor:pointer; width:100%; text-transform:uppercase; font-size:10px;">Login</button>
    </div>
    <script>async function login(){const pw=document.getElementById('pw').value;const r=await fetch('/core/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pw})});const res=await r.json();if(res.ok){localStorage.setItem('jestri_key','AUTHORIZED');location.href='/admin';}else{alert('Denied');}}</script></body></html>`);
});

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: white; margin: 0; }
        
        /* FIX: Ukuran Form yang Compact */
        .admin-sidebar { width: 300px; background: #111; border-right: 1px solid rgba(255,255,255,0.05); height: 100vh; position: fixed; left: 0; top: 0; z-index: 50; padding: 30px; }
        .admin-main { margin-left: 300px; padding: 40px; }
        
        /* FIX: Form di Mobile agar tidak lebar */
        @media (max-width: 1024px) {
            .admin-sidebar { position: relative; width: 100%; height: auto; border-right: none; padding: 20px; display: flex; flex-direction: column; align-items: center; }
            .admin-main { margin-left: 0; padding: 20px; }
            .compact-container { max-width: 340px; width: 100%; } /* Form tidak akan lebih lebar dari 340px */
        }
        
        .compact-input { background: #000; border: 1px solid #222; border-radius: 12px; padding: 10px 14px; font-size: 12px; color: white; width: 100%; outline: none; transition: 0.3s; }
        .compact-input:focus { border-color: #007AFF; box-shadow: 0 0 10px rgba(0,122,255,0.1); }
        .glass-card { background: #111; border: 1px solid rgba(255,255,255,0.03); border-radius: 24px; }
    </style></head>
    <body>
        <script>if(localStorage.getItem('jestri_key') !== 'AUTHORIZED') location.href='/login';</script>

        <aside class="admin-sidebar">
            <div class="compact-container w-full">
                <div class="flex justify-between items-center mb-8">
                    <h1 class="text-[10px] font-black italic uppercase tracking-[0.3em] text-blue-500">Add Asset</h1>
                    <button onclick="localStorage.removeItem('jestri_key'); location.href='/login';" class="text-[9px] text-red-500 font-bold uppercase hover:opacity-50">Logout</button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block ml-1">Asset Name</label>
                        <input id="j" placeholder="Judul e-book..." class="compact-input">
                    </div>
                    <div>
                        <label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block ml-1">Price</label>
                        <input id="h" type="number" placeholder="Nominal..." class="compact-input">
                    </div>
                    <div>
                        <label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block ml-1">Category</label>
                        <select id="g" class="compact-input">
                            ${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-[9px] text-gray-600 font-black uppercase mb-1.5 block ml-1">Cover</label>
                        <input type="file" id="cv" class="text-[9px] text-gray-500 file:bg-blue-600/10 file:text-blue-500 file:border-0 file:rounded-lg file:px-3 file:py-1 cursor-pointer">
                    </div>
                    <button onclick="saveB()" id="sb" class="w-full bg-blue-600 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-blue-500 active:scale-95 transition mt-2">Publish</button>
                </div>

                <div class="mt-8 pt-6 border-t border-white/5 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-tighter italic">System: Online</span>
                </div>
            </div>
        </aside>

        <main class="admin-main">
            <div class="max-w-3xl mx-auto">
                <div class="flex justify-between items-end mb-10 border-b border-white/5 pb-6">
                    <div>
                        <h2 class="text-3xl font-black italic uppercase tracking-tighter">Orders.</h2>
                        <p class="text-[9px] text-gray-600 font-black tracking-[0.4em] uppercase">Queue Management</p>
                    </div>
                    <a href="/" target="_blank" class="text-[9px] font-black text-gray-500 bg-white/5 px-4 py-2 rounded-full hover:text-white transition uppercase tracking-widest">Site</a>
                </div>

                <div id="olist" class="space-y-4">
                    </div>
            </div>
        </main>

        <script>
            async function load(){
                const r = await fetch('/core/get-orders'); const o = await r.json();
                document.getElementById('olist').innerHTML = o.map(x => \`
                <div class="glass-card p-5 flex flex-col md:flex-row gap-5 items-center group">
                    <img src="\${x.bukti}" class="w-20 md:w-24 h-32 object-cover rounded-xl border border-white/5 shadow-2xl transition duration-500" onclick="window.open('\${x.bukti}')">
                    <div class="flex-grow w-full">
                        <div class="flex justify-between items-start mb-1">
                            <h4 class="text-lg font-black text-blue-500 italic">Rp \${x.total.toLocaleString()}</h4>
                            <span class="text-[7px] border border-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full font-black uppercase">Pending</span>
                        </div>
                        <p class="text-[9px] text-gray-500 mb-5 font-bold italic line-clamp-1">\${x.items.map(i=>i.judul).join(' • ')}</p>
                        <div class="flex gap-2">
                            <input id="l-\${x._id}" placeholder="Download link..." class="flex-grow p-2.5 bg-black border border-white/5 rounded-lg text-[10px] outline-none focus:border-blue-500 transition">
                            <button onclick="acc('\${x._id}')" class="bg-blue-600 px-5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-blue-500 transition">Verify</button>
                        </div>
                    </div>
                </div>\`).join('') || '<div class="py-20 text-center text-gray-800 font-black uppercase tracking-[0.5em] italic">Empty Queue</div>';
            }
            async function saveB(){
                const f = document.getElementById('cv').files[0]; if(!f) return alert("Select Cover");
                const btn = document.getElementById('sb'); btn.disabled = true; btn.innerText = "UPLOADING...";
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                try {
                    const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                    await fetch('/core/save-buku',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                    location.reload();
                } catch(e) { alert("Fail"); btn.disabled = false; btn.innerText = "Publish"; }
            }
            async function acc(id){
                const link = document.getElementById('l-'+id).value; if(!link) return alert("Link!");
                await fetch('/core/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({link}) });
                alert("Verified!"); location.reload();
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

