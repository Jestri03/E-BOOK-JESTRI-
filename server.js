const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- 1. CORE SYSTEM ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 System Operational")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, investasi: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_v26_final', keys: ['ELITE_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 2. THE VISIONARY FRONTEND ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Digital Literacy Redefined</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');
        :root { --rich-black: #0A0A0A; --elegant-blue: #007AFF; }
        body { font-family: 'Inter', sans-serif; background: var(--rich-black); color: white; margin: 0; }
        .glass { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar { transition: 0.5s transform cubic-bezier(0.16, 1, 0.3, 1); background: #0F0F11; border-right: 1px solid rgba(255,255,255,0.05); }
        .book-card { background: #161618; border-radius: 20px; transition: 0.4s; overflow: hidden; border: 1px solid rgba(255,255,255,0.03); }
        .book-card:hover { transform: translateY(-10px); border-color: var(--elegant-blue); }
        .qris-box { background: white; padding: 10px; border-radius: 15px; display: inline-block; }
    </style></head><body>

    <nav class="glass sticky top-0 z-[100] p-5 px-8 flex justify-between items-center">
        <div class="flex items-center gap-6">
            <i class="fa-solid fa-bars-staggered text-xl cursor-pointer hover:text-blue-500" onclick="togSide(true)"></i>
            <h1 class="text-xl font-black tracking-tighter uppercase italic">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        </div>
        <div class="flex items-center gap-4">
            <a href="https://wa.me/6285189415489" class="text-gray-400 hover:text-green-500 transition text-xl"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="https://instagram.com/jesssstri" class="text-gray-400 hover:text-pink-500 transition text-xl"><i class="fa-brands fa-instagram"></i></a>
            <button onclick="togCart(true)" class="bg-white/5 p-3 px-5 rounded-full border border-white/10 ml-2">
                <i class="fa-solid fa-bag-shopping text-blue-500"></i> <span id="cartCount" class="font-bold ml-1 text-xs">0</span>
            </button>
        </div>
    </nav>

    <div id="ov" onclick="togSide(false)" class="fixed inset-0 bg-black/90 z-[110] hidden backdrop-blur-md"></div>
    <aside id="sb" class="sidebar fixed top-0 left-0 h-full w-80 z-[120] -translate-x-full p-10">
        <div class="flex justify-between items-center mb-16">
            <span class="text-[10px] font-black tracking-[0.4em] text-gray-500">EXPLORE</span>
            <i class="fa-solid fa-xmark cursor-pointer" onclick="togSide(false)"></i>
        </div>
        <div class="space-y-3">
            <button onclick="setFilter('Semua')" class="w-full text-left p-4 rounded-2xl bg-white/5 font-bold hover:bg-blue-600 transition">Semua Koleksi</button>
            ${LIST_GENRE.map(g => `<button onclick="setFilter('${g}')" class="w-full text-left p-4 rounded-2xl border border-transparent hover:bg-white/5 transition text-gray-400 hover:text-white">${g}</button>`).join('')}
            <div class="pt-10">
                <p class="text-[10px] font-black text-gray-600 mb-4 tracking-widest uppercase italic">Support Us</p>
                <a href="https://saweria.co/jesssstri" class="block w-full text-center p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-xs uppercase tracking-widest">Donate Now</a>
            </div>
        </div>
    </aside>

    <main class="max-w-7xl mx-auto p-8 py-20">
        <header class="mb-20 text-center md:text-left">
            <h2 id="vTitle" class="text-5xl font-black mb-4 tracking-tighter">Investasi Literasi.</h2>
            <p class="text-gray-500 uppercase text-[10px] tracking-[0.4em] font-black italic">Digital Excellence by E-Book Jestri</p>
        </header>

        <div id="grid" class="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div class="h-80 bg-white/5 rounded-3xl animate-pulse"></div>
            <div class="h-80 bg-white/5 rounded-3xl animate-pulse"></div>
        </div>
    </main>

    <div id="md" class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4 backdrop-blur-xl">
        <div class="bg-[#111] w-full max-w-lg rounded-[2.5rem] p-10 border border-white/5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-2xl font-black mb-6">Akses Instan.</h3>
            <div id="cartList" class="space-y-4 mb-8 border-b border-white/5 pb-6"></div>
            
            <div class="text-center mb-8 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                <p class="text-[10px] font-black text-blue-500 mb-4 tracking-widest uppercase">Scan QRIS / Transfer E-Wallet</p>
                <div class="qris-box mb-4">
                    <img src="https://i.ibb.co.com/jP4fBvY8/Screenshot-20250304-104953-CIMB-OCTO.jpg" class="w-48 h-auto" alt="QRIS JESTRI">
                </div>
                <p class="text-xs font-bold text-gray-400 tracking-tighter uppercase">DANA: 0895327806441</p>
            </div>

            <div class="flex justify-between font-black text-xl mb-10">
                <span class="text-gray-500">Total Investasi</span>
                <span id="cartTotal" class="text-blue-500">Rp 0</span>
            </div>

            <input type="file" id="fi" class="hidden" onchange="document.getElementById('ftxt').innerText='✅ BUKTI INVESTASI SIAP'">
            <label for="fi" class="block border-2 border-dashed border-white/10 p-5 rounded-2xl text-center cursor-pointer hover:border-blue-500 mb-6 transition">
                <span id="ftxt" class="text-xs font-bold text-gray-400 uppercase">Upload Bukti Transfer</span>
            </label>

            <button onclick="prosesBayar()" id="btnBayar" class="w-full bg-blue-600 py-6 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:bg-blue-500">Konfirmasi Sekarang</button>
            <button onclick="togCart(false)" class="w-full mt-6 text-gray-600 text-[10px] font-bold uppercase tracking-widest">Batal</button>
        </div>
    </div>

    <script>
        let allB = [], cart = [];
        async function init() {
            const r = await fetch('/api/buku-json');
            allB = await r.json();
            render('Semua');
        }
        function togSide(st) {
            document.getElementById('sb').style.transform = st ? 'translateX(0)' : 'translateX(-100%)';
            document.getElementById('ov').classList.toggle('hidden', !st);
        }
        function setFilter(g) {
            document.getElementById('vTitle').innerText = g === 'Semua' ? 'Investasi Literasi.' : g;
            render(g); togSide(false);
        }
        function render(g) {
            const grid = document.getElementById('grid');
            const data = g === 'Semua' ? allB : allB.filter(b => b.genre === g);
            grid.innerHTML = data.map(b => \`
                <div class="book-card group">
                    <div class="aspect-[3/4] overflow-hidden bg-[#222]">
                        <img src="\${b.gambar}" crossorigin="anonymous" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" onerror="this.src='https://placehold.co/400x600/0A0A0A/FFF?text=E-BOOK+JESTRI'">
                    </div>
                    <div class="p-6">
                        <p class="text-[10px] text-blue-500 font-black uppercase mb-1">\${b.genre}</p>
                        <h4 class="font-bold text-sm h-10 line-clamp-2 mb-4 leading-tight">\${b.judul}</h4>
                        <div class="flex justify-between items-center pt-4 border-t border-white/5">
                            <span class="font-black text-lg italic">Rp \${b.investasi.toLocaleString()}</span>
                            <button onclick="addCart('\${b._id}')" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-blue-600 transition"><i class="fa-solid fa-plus text-xs"></i></button>
                        </div>
                    </div>
                </div>\`).join('');
        }
        function addCart(id) {
            const b = allB.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) {
                cart.push(b);
                document.getElementById('cartCount').innerText = cart.length;
            }
        }
        function togCart(st) {
            if(st && !cart.length) return alert("Pilih literatur Anda.");
            const m = document.getElementById('md');
            m.classList.toggle('hidden', !st); m.style.display = st ? 'flex' : 'none';
            if(st) {
                document.getElementById('cartList').innerHTML = cart.map(x => \`<div class="flex justify-between font-bold text-xs uppercase"><span>\${x.judul}</span><span class="text-blue-500">Rp \${x.investasi.toLocaleString()}</span></div>\`).join('');
                document.getElementById('cartTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.investasi,0).toLocaleString();
            }
        }
        async function prosesBayar() {
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Upload bukti transfer wajib.");
            const btn = document.getElementById('btnBayar'); btn.disabled = true; btn.innerText = "MENGIRIM...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            try {
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/api/order', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.investasi,0), bukti: up.secure_url })
                });
                alert("✅ Investasi Terkirim! Akses akan dikirim admin dalam < 15 menit.");
                location.reload();
            } catch(e) { alert("Sistem sibuk."); btn.disabled = false; }
        }
        init();
    </script></body></html>`);
});

// --- 3. ADMIN: THE CONTROL ROOM ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-[#0A0A0A] text-white p-10">
        <div class="max-w-6xl mx-auto flex justify-between items-center mb-16">
            <h1 class="text-2xl font-black italic italic">ELITE <span class="text-blue-500">CONTROL</span></h1>
            <div class="flex gap-6 items-center">
                <a href="/" class="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white">Visit Site</a>
                <a href="/logout" class="text-xs font-bold uppercase text-red-500">Logout</a>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div class="bg-[#111] p-8 rounded-[2rem] border border-white/5 h-fit">
                <h3 class="text-xs font-black uppercase text-blue-500 mb-6 tracking-widest">Add Catalog</h3>
                <div class="space-y-4">
                    <input id="j" placeholder="Judul" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">
                    <input id="p" placeholder="Penulis" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">
                    <input id="h" type="number" placeholder="Nominal Investasi" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">
                    <select id="g" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                    <input type="file" id="cv" class="text-xs text-gray-500">
                    <button onclick="saveB()" id="sb" class="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase shadow-xl mt-4">Publish Now</button>
                </div>
            </div>
            <div class="lg:col-span-2 space-y-8">
                <h3 class="text-xs font-black uppercase text-blue-500 mb-6 tracking-widest">Verification Queue (${o.length})</h3>
                ${o.map(x => `
                <div class="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-8">
                    <a href="${x.bukti}" target="_blank" class="block w-full md:w-52 h-72"><img src="${x.bukti}" class="w-full h-full object-cover rounded-3xl border border-white/10"></a>
                    <div class="flex-grow">
                        <h4 class="text-2xl font-black text-blue-500 mb-2 italic">Rp ${x.total.toLocaleString()}</h4>
                        <p class="text-[10px] text-gray-400 font-bold uppercase mb-8">${x.items.map(i=>i.judul).join(' • ')}</p>
                        <input id="link-${x._id}" placeholder="MediaFire Link" class="w-full p-4 bg-black border border-blue-900 rounded-2xl text-xs mb-4">
                        <div class="flex gap-2">
                            <button onclick="acc('${x._id}')" class="flex-grow bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Approve Access</button>
                            <button onclick="delO('${x._id}')" class="bg-red-900/10 text-red-500 px-6 rounded-2xl font-black text-xs hover:bg-red-600 transition">X</button>
                        </div>
                    </div>
                </div>`).join('') || '<p class="text-gray-600 italic py-20 text-center">No orders yet.</p>'}
            </div>
        </div>
        <script>
            async function saveB(){
                const f = document.getElementById('cv').files[0]; if(!f) return alert("Pilih cover!");
                const btn = document.getElementById('sb'); btn.disabled = true; btn.innerText = "UP...";
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                location.reload();
            }
            async function acc(id){
                const link = document.getElementById('link-'+id).value; if(!link) return alert("Link MediaFire wajib.");
                await fetch('/admin/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({downloadLink: link}) });
                alert("Approved!"); location.reload();
            }
            async function delO(id){ if(confirm('Delete?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        </script>
    </body></html>`);
});

// --- 4. SYSTEM ROUTES ---
app.get('/login', (req, res) => { res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; display:flex; align-items:center; justify-content:center; height:100vh;"><form action="/login" method="POST" style="text-align:center;"><input name="pw" type="password" placeholder="Passcode" style="padding:20px; border-radius:15px; border:1px solid #333; background:#111; color:white; text-align:center; width:250px;"><br><button style="margin-top:20px; color:#007AFF; font-weight:900; background:none; border:none; cursor:pointer;">VERIFY ACCESS</button></form></body></html>`); });
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.get('/logout', (req, res) => { req.session = null; res.redirect('/login'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.downloadLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });

app.listen(process.env.PORT || 3000);

