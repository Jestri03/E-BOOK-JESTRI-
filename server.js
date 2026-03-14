const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE & SCHEMA ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 Secure Connection Established")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, investasi: Number, gambar: String, genre: String, status: String 
});
const Order = mongoose.model('Order', { 
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String, createdAt: { type: Date, default: Date.now } 
});

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_vip_2026', keys: ['ELITE_ACCESS'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. FRONTEND: E-BOOK JESTRI (ESTETIKA RICH BLACK) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Digital Literacy, Redefined</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
        :root { --rich-black: #0A0A0A; --elegant-blue: #007AFF; --card-bg: #161618; }
        body { font-family: 'Inter', sans-serif; background: var(--rich-black); color: #ffffff; scroll-smooth: always; }
        .glass { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .book-card { background: var(--card-bg); border: 1px solid rgba(255,255,255,0.03); transition: all 0.4s ease; border-radius: 20px; overflow: hidden; }
        .book-card:hover { transform: translateY(-10px); border-color: var(--elegant-blue); box-shadow: 0 20px 40px rgba(0,122,255,0.1); }
        .sidebar { transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); background: #0F0F11; border-right: 1px solid rgba(255,255,255,0.05); }
        .btn-vip { background: var(--elegant-blue); transition: 0.3s; box-shadow: 0 10px 20px rgba(0,122,255,0.3); }
        .btn-vip:hover { transform: scale(1.05); box-shadow: 0 15px 30px rgba(0,122,255,0.5); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    </style></head><body>

    <nav class="glass sticky top-0 z-[100] px-6 py-5">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-6">
                <i class="fa-solid fa-bars-staggered text-xl cursor-pointer hover:text-blue-500 transition" onclick="togSide()"></i>
                <h1 class="text-xl font-extrabold tracking-tighter">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
            </div>
            <div class="flex items-center gap-6">
                <div class="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <a href="#" class="hover:text-white transition">Eksplorasi</a>
                    <a href="#" class="hover:text-white transition">Koleksi</a>
                    <a href="#" class="hover:text-white transition">Tentang</a>
                </div>
                <button onclick="togCart()" class="bg-white/5 p-3 px-5 rounded-full border border-white/10 hover:bg-white/10 transition">
                    <i class="fa-solid fa-bag-shopping text-blue-500"></i> <span id="cartCount" class="ml-2 font-bold text-xs">0</span>
                </button>
            </div>
        </div>
    </nav>

    <div id="ov" onclick="togSide()" class="fixed inset-0 bg-black/80 z-[110] hidden backdrop-blur-sm"></div>
    <aside id="sb" class="sidebar fixed top-0 left-0 h-full w-80 z-[120] -translate-x-full p-10">
        <div class="flex justify-between items-center mb-12">
            <span class="text-xs font-black tracking-[0.3em] text-gray-500">KATEGORI VIP</span>
            <i class="fa-solid fa-xmark cursor-pointer text-gray-500" onclick="togSide()"></i>
        </div>
        <div class="space-y-4">
            <button onclick="filterG('Semua')" class="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500 transition text-sm font-bold">Semua Koleksi</button>
            ${LIST_GENRE.map(g => `<button onclick="filterG('${g}')" class="w-full text-left p-4 rounded-2xl border border-transparent hover:bg-white/5 hover:border-white/10 transition text-sm text-gray-400 hover:text-white">${g}</button>`).join('')}
        </div>
    </aside>

    <header class="py-24 px-6 text-center max-w-5xl mx-auto">
        <span class="text-[10px] font-black tracking-[0.5em] text-blue-500 uppercase mb-6 block">Digital Literacy, Redefined</span>
        <h2 class="text-5xl md:text-7xl font-extrabold leading-tight mb-8">Definisi Baru <br> Literasi Digital <span class="text-gray-500 italic">Masa Kini.</span></h2>
        <p class="text-gray-400 text-lg md:text-xl leading-relaxed mb-12 max-w-3xl mx-auto font-light">E-BOOK JESTRI memadukan teknologi web modern dengan estetika tinggi untuk menghadirkan ekosistem literatur digital premium.</p>
        <div class="flex justify-center gap-12 text-center border-y border-white/5 py-8 mb-12">
            <div><p class="text-2xl font-black">500+</p><p class="text-[10px] text-gray-500 uppercase tracking-widest">Koleksi Pilihan</p></div>
            <div><p class="text-2xl font-black">2.4k</p><p class="text-[10px] text-gray-500 uppercase tracking-widest">Pembaca Aktif</p></div>
            <div><p class="text-2xl font-black">15m</p><p class="text-[10px] text-gray-500 uppercase tracking-widest">Akses Instan</p></div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 pb-24">
        <div id="grid" class="grid grid-cols-2 lg:grid-cols-4 gap-8">
            </div>
    </main>

    <footer class="border-t border-white/5 py-20 px-6 text-center">
        <h1 class="text-2xl font-black mb-4 tracking-tighter italic">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        <p class="text-gray-600 text-xs mb-8 tracking-widest uppercase">© 2026 E-BOOK JESTRI. All Rights Reserved.</p>
        <div class="flex justify-center gap-6 text-gray-400 text-xl">
            <a href="https://wa.me/6285189415489" class="hover:text-blue-500"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="https://instagram.com/jesssstri" class="hover:text-blue-500"><i class="fa-brands fa-instagram"></i></a>
        </div>
    </footer>

    <div id="md" class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4">
        <div class="bg-[#111] w-full max-w-md rounded-[2.5rem] p-10 border border-white/5">
            <h3 class="text-2xl font-black mb-2">Investasi Pengetahuan.</h3>
            <p class="text-gray-500 text-xs mb-8">Selesaikan langkah untuk mendapatkan Akses Instan.</p>
            <div id="cl" class="space-y-3 mb-8 border-b border-white/5 pb-6"></div>
            <div class="flex justify-between font-black text-xl mb-8">
                <span class="text-gray-400">Total Investasi</span>
                <span id="ct" class="text-blue-500">Rp 0</span>
            </div>
            <div class="bg-white/5 p-6 rounded-3xl mb-8 border border-white/5">
                <p class="text-[10px] font-black text-center text-blue-400 mb-4 tracking-widest uppercase italic">DANA: 0895327806441</p>
                <input type="file" id="fi" class="hidden" onchange="document.getElementById('lt').innerText='✅ BUKTI SIAP'">
                <label for="fi" class="block border border-dashed border-white/10 p-5 rounded-2xl text-center cursor-pointer hover:bg-white/5">
                    <span id="lt" class="text-xs font-bold text-gray-400 uppercase">Upload Bukti Transfer</span>
                </label>
            </div>
            <button onclick="pay()" id="bp" class="btn-vip w-full text-white py-6 rounded-2xl font-black text-sm tracking-widest uppercase">Konfirmasi & Akses Instan</button>
            <button onclick="togCart()" class="w-full mt-4 text-gray-600 text-[10px] font-black uppercase tracking-widest">Batal</button>
        </div>
    </div>

    <script>
        let allB = [], cart = [];
        async function load(){
            const r = await fetch('/api/buku-json'); allB = await r.json();
            render(allB);
        }
        function togSide(){ document.getElementById('sb').classList.toggle('-translate-x-full'); document.getElementById('ov').classList.toggle('hidden'); }
        function render(data){
            document.getElementById('grid').innerHTML = data.map(b => \`
                <div class="book-card group">
                    <div class="aspect-[3/4] overflow-hidden bg-[#222]">
                        <img src="\${b.gambar}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onerror="this.src='https://placehold.co/400x600/0A0A0A/333?text=E-BOOK+JESTRI'">
                    </div>
                    <div class="p-6">
                        <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">\${b.genre}</p>
                        <h4 class="font-bold text-sm leading-tight h-10 mb-4 line-clamp-2">\${b.judul}</h4>
                        <div class="flex justify-between items-center">
                            <span class="text-lg font-black tracking-tighter italic">Rp \${b.investasi.toLocaleString()}</span>
                            <button onclick="add('\${b._id}')" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-500 transition"><i class="fa-solid fa-plus text-xs"></i></button>
                        </div>
                    </div>
                </div>\`).join('');
        }
        function add(id){
            const b = allB.find(x=>x._id===id); if(!cart.find(x=>x._id===id)) cart.push(b);
            document.getElementById('cartCount').innerText = cart.length;
        }
        function filterG(g){ render(g==='Semua'?allB:allB.filter(x=>x.genre===g)); togSide(); }
        function togCart(){
            if(!cart.length) return alert("Pilih literatur Anda.");
            const m = document.getElementById('md');
            m.classList.toggle('hidden'); m.style.display = m.classList.contains('hidden') ? 'none' : 'flex';
            document.getElementById('cl').innerHTML = cart.map(x=>\`<div class="flex justify-between text-[11px] font-bold"><span>\${x.judul}</span><span class="text-blue-500">Rp \${x.investasi.toLocaleString()}</span></div>\`).join('');
            document.getElementById('ct').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.investasi,0).toLocaleString();
        }
        async function pay(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Sertakan bukti investasi.");
            const btn = document.getElementById('bp'); btn.disabled = true; btn.innerText = "VERIFYING...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items:cart, total:cart.reduce((a,b)=>a+b.investasi,0), bukti:up.secure_url}) });
            alert("Terima kasih. Tim kami akan memproses akses Anda dalam < 15 menit.");
            location.reload();
        }
        load();
    </script></body></html>`);
});

// --- 2. ADMIN: ELITE MANAGEMENT (SECRET URL) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-[#0A0A0A] text-white p-8 font-sans">
        <div class="max-w-6xl mx-auto">
            <h1 class="text-3xl font-black mb-12 italic tracking-tighter">ELITE <span class="text-blue-500">CONTROL</span></h1>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div class="bg-[#111] p-8 rounded-[2rem] border border-white/5 h-fit">
                    <h3 class="font-bold mb-6 text-blue-500 uppercase tracking-widest text-xs">Tambah Koleksi</h3>
                    <div class="space-y-4">
                        <input id="j" placeholder="Judul Literatur" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">
                        <input id="p" placeholder="Penulis" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">
                        <input id="h" type="number" placeholder="Investasi (Nominal)" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">
                        <select id="g" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                        <input type="file" id="fi" class="text-xs text-gray-500">
                        <button onclick="saveB()" id="bs" class="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Simpan Koleksi</button>
                    </div>
                </div>

                <div class="lg:col-span-2">
                    <h3 class="font-bold mb-6 text-blue-500 uppercase tracking-widest text-xs italic">Verifikasi Investasi (${o.length})</h3>
                    <div class="space-y-8">
                        ${o.map(x => `
                        <div class="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-8">
                            <img src="${x.bukti}" class="w-full md:w-56 h-72 object-cover rounded-3xl border border-white/10" onerror="this.src='https://placehold.co/400x600/333/666?text=Bukti+Gagal+Muat'">
                            <div class="flex-grow">
                                <h4 class="text-2xl font-black mb-2 italic text-blue-500">Rp ${x.total.toLocaleString()}</h4>
                                <p class="text-[10px] text-gray-500 mb-6 font-bold uppercase tracking-widest">${x.items.map(i=>i.judul).join(' • ')}</p>
                                <input id="link-${x._id}" placeholder="Link MediaFire" class="w-full p-4 bg-black border border-blue-900 rounded-2xl mb-4 text-xs">
                                <div class="flex gap-3">
                                    <button onclick="acc('${x._id}')" class="flex-grow bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Setujui</button>
                                    <button onclick="delO('${x._id}')" class="bg-red-900/20 text-red-500 px-6 rounded-2xl font-black text-xs">X</button>
                                </div>
                            </div>
                        </div>`).join('') || '<p class="text-gray-600 italic py-20 text-center border border-dashed border-white/5 rounded-3xl">Antrean verifikasi kosong.</p>'}
                    </div>
                </div>
            </div>
        </div>
        <script>
            async function saveB(){
                const f = document.getElementById('fi').files[0]; if(!f) return alert("Cover diperlukan.");
                const btn = document.getElementById('bs'); btn.disabled = true; btn.innerText = "UPLOADING...";
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                location.reload();
            }
            async function acc(id){
                const link = document.getElementById('link-'+id).value; if(!link) return alert("Link MediaFire wajib diisi.");
                await fetch('/admin/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({downloadLink: link}) });
                alert("Akses Instan dikirim."); location.reload();
            }
            async function delO(id){ if(confirm('Tolak?')) { await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        </script>
    </body></html>`);
});

// --- API & LOGIN (HIDDEN SECURITY) ---
app.get('/login', (req, res) => { res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;"><form action="/login" method="POST" style="text-align:center;"><input name="pw" type="password" placeholder="Elite Access Code" style="padding:20px; border-radius:15px; border:1px solid #333; background:#111; color:white; width:250px; text-align:center; margin-bottom:15px;"><br><button style="color:#007AFF; font-weight:900; background:none; border:none; cursor:pointer;">VERIFY ACCESS</button></form></body></html>`); });
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.downloadLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });

app.listen(process.env.PORT || 3000);

