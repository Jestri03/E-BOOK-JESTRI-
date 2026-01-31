const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("🚀 Database Connected")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_v5', keys: ['SECRET_KEY_PRO'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. UI PEMBELI (E-BOOK JESTRI) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Premium Library</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;800&family=Inter:wght@400;600&display=swap');
        :root { --primary: #0B4D74; --amber: #F59E0B; }
        body { font-family: 'Inter', sans-serif; background: #F8FAFC; }
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .glass { background: rgba(11, 77, 116, 0.98); backdrop-filter: blur(10px); }
        .card-pro { transition: 0.3s; border: 1px solid #e2e8f0; background: white; border-radius: 1.5rem; overflow: hidden; }
        .card-pro:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    </style></head><body class="pb-24">

    <header class="glass sticky top-0 z-50 text-white p-4 px-6 flex justify-between items-center shadow-xl">
        <div class="flex items-center gap-3">
            <i class="fa-solid fa-bars-staggered cursor-pointer" onclick="tog()"></i>
            <h1 class="font-poppins font-extrabold text-xl tracking-tighter">E-BOOK <span class="text-amber-400">JESTRI</span></h1>
        </div>
        <div class="bg-white/10 p-2 px-4 rounded-full cursor-pointer" onclick="openCart()">
            <i class="fa-solid fa-cart-shopping text-amber-400"></i> <span id="cc" class="ml-1 font-bold">0</span>
        </div>
    </header>

    <div id="ov" onclick="tog()" class="fixed inset-0 bg-black/50 z-[60] hidden backdrop-blur-sm"></div>
    <aside id="sb" class="fixed top-0 left-0 h-full w-72 bg-[#0F172A] z-[70] transition-transform -translate-x-full p-6 text-white">
        <h2 class="font-poppins font-black text-2xl text-amber-400 mb-8 italic">MENU</h2>
        <div class="space-y-2">
            <div onclick="setG('Semua')" class="p-3 rounded-xl cursor-pointer hover:bg-white/10 font-bold">Semua Koleksi</div>
            ${LIST_GENRE.map(g => `<div onclick="setG('${g}')" class="p-3 rounded-xl cursor-pointer hover:bg-white/10 transition">${g}</div>`).join('')}
        </div>
    </aside>

    <main class="max-w-6xl mx-auto p-6">
        <div class="bg-gradient-to-r from-[#0B4D74] to-[#1e293b] rounded-[2rem] p-8 text-white mb-10 shadow-2xl relative overflow-hidden">
            <h2 class="font-poppins font-bold text-2xl relative z-10">Katalog E-Book Premium</h2>
            <p class="text-blue-200 text-sm relative z-10">Beli sekarang, baca selamanya.</p>
            <i class="fa-solid fa-book absolute right-[-20px] bottom-[-20px] text-[150px] opacity-10 rotate-12"></i>
        </div>

        <div id="grid" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
    </main>

    <div id="proof" class="fixed bottom-24 left-6 bg-white p-3 rounded-2xl shadow-2xl flex items-center gap-3 z-40 translate-y-40 transition-transform duration-500 border border-slate-100">
        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">NEW</div>
        <div class="text-[10px]">
            <p class="text-gray-400">Baru saja dibeli</p>
            <p id="pBook" class="font-bold text-slate-800 truncate w-32"></p>
        </div>
    </div>

    <div class="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <a href="https://wa.me/6285189415489" class="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl text-2xl"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://instagram.com/jesssstri" class="w-14 h-14 bg-gradient-to-tr from-orange-400 via-red-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl text-2xl"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="md" class="fixed inset-0 z-[100] bg-black/80 hidden items-center justify-center p-4">
        <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-bounce-in">
            <h3 class="font-poppins font-black text-2xl text-[#0B4D74] mb-2">Checkout</h3>
            <div id="cl" class="max-h-40 overflow-auto mb-4 border-b pb-4 space-y-2"></div>
            <div class="flex justify-between items-center mb-6">
                <span class="font-bold text-slate-400">Total:</span>
                <span id="ct" class="text-2xl font-black text-amber-500">Rp 0</span>
            </div>
            <div class="bg-blue-50 p-4 rounded-2xl mb-6 text-center">
                <p class="text-[10px] font-bold text-blue-800 mb-2">TRANSFER KE DANA: 0895327806441</p>
                <input type="file" id="fup" class="hidden" onchange="document.getElementById('lb').innerText='✅ BUKTI SIAP'">
                <label id="lb" for="fup" class="block bg-white border-2 border-dashed border-blue-300 p-4 rounded-xl cursor-pointer font-bold text-blue-600 text-xs">UPLOAD BUKTI TF</label>
            </div>
            <button onclick="pay()" id="btnP" class="w-full bg-[#0B4D74] text-white py-5 rounded-2xl font-black shadow-lg">KONFIRMASI PEMBAYARAN</button>
        </div>
    </div>

    <script>
        let allB = [], cart = [];
        async function load(){
            const r = await fetch('/api/buku-json'); allB = await r.json();
            render(allB);
            setInterval(() => {
                if(allB.length > 0) {
                    document.getElementById('pBook').innerText = allB[Math.floor(Math.random()*allB.length)].judul;
                    document.getElementById('proof').classList.remove('translate-y-40');
                    setTimeout(() => document.getElementById('proof').classList.add('translate-y-40'), 4000);
                }
            }, 10000);
        }
        function tog(){ document.getElementById('sb').classList.toggle('-translate-x-full'); document.getElementById('ov').classList.toggle('hidden'); }
        function render(data){
            document.getElementById('grid').innerHTML = data.map(b => \`
                <div class="card-pro flex flex-col h-full shadow-sm">
                    <img src="\${b.gambar}" class="w-full aspect-[3/4] object-cover" onerror="this.src='https://placehold.co/300x400?text=No+Cover'">
                    <div class="p-4 flex flex-col flex-grow">
                        <h4 class="font-bold text-sm text-slate-800 line-clamp-2 h-10 mb-2">\${b.judul}</h4>
                        <div class="mt-auto flex justify-between items-center">
                            <span class="font-black text-blue-900 text-xs text-sm">Rp \${b.harga.toLocaleString()}</span>
                            <button onclick="add('\${b._id}')" class="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </div>\`).join('');
        }
        function add(id){
            const b = allB.find(x=>x._id===id); if(!cart.find(x=>x._id===id)) cart.push(b);
            document.getElementById('cc').innerText = cart.length;
        }
        function setG(g){
            document.getElementById('grid').innerHTML = '<p class="col-span-2 text-center py-10">Memuat...</p>';
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g)); tog();
        }
        function openCart(){
            if(!cart.length) return alert("Pilih buku dulu!");
            document.getElementById('md').style.display = 'flex';
            document.getElementById('cl').innerHTML = cart.map(x=>\`<div class="flex justify-between text-xs font-bold"><span>\${x.judul}</span><span>Rp \${x.harga.toLocaleString()}</span></div>\`).join('');
            document.getElementById('ct').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.harga,0).toLocaleString();
        }
        async function pay(){
            const f = document.getElementById('fup').files[0]; if(!f) return alert("Upload bukti transfer!");
            const btn = document.getElementById('btnP'); btn.disabled = true; btn.innerText = "MENGIRIM...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items:cart, total:cart.reduce((a,b)=>a+b.harga,0), bukti:up.secure_url}) });
            alert("✅ Pembayaran terkirim! Admin akan memproses link download Anda.");
            location.reload(); // KEMBALI KE TAMPILAN BUKU
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#1e293b; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; margin:0;">
    <form action="/login" method="POST" style="background:rgba(255,255,255,0.05); padding:40px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); text-align:center; color:white;">
        <h2 style="margin-bottom:20px;">E-BOOK JESTRI ADMIN</h2>
        <input name="pw" type="password" placeholder="Passcode" style="padding:15px; border-radius:10px; border:none; width:200px; text-align:center; margin-bottom:15px;"><br>
        <button style="padding:15px 40px; border-radius:10px; border:none; background:#0ea5e9; color:white; font-weight:bold; cursor:pointer;">MASUK</button>
    </form></body></html>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (APPROVE & MEDIAFIRE) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    
    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-50 p-6 font-sans">
    <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-black text-slate-800">E-BOOK JESTRI ADMIN</h1>
            <a href="/" class="font-bold text-blue-600">Ke Toko</a>
        </div>

        <div class="bg-white p-8 rounded-[2rem] shadow-sm mb-10 border border-slate-200">
            <h3 class="font-bold mb-4">Tambah Katalog Baru</h3>
            <div class="grid grid-cols-2 gap-4">
                <input id="j" placeholder="Judul" class="p-4 bg-slate-50 rounded-xl outline-none">
                <input id="p" placeholder="Penulis" class="p-4 bg-slate-50 rounded-xl outline-none">
                <input id="h" type="number" placeholder="Harga" class="p-4 bg-slate-50 rounded-xl outline-none">
                <select id="g" class="p-4 bg-slate-50 rounded-xl outline-none">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                <input type="file" id="fi" class="col-span-2">
            </div>
            <button onclick="addB()" id="btnS" class="w-full bg-slate-800 text-white py-4 rounded-xl mt-6 font-bold">PUBLISH</button>
        </div>

        <h3 class="font-bold mb-4">Persetujuan Pesanan (${o.length})</h3>
        <div class="space-y-4 mb-10">
            ${o.map(x => `
                <div class="bg-white p-6 rounded-[2rem] border-l-8 border-amber-500 shadow-sm">
                    <div class="flex justify-between items-center mb-4">
                        <b class="text-blue-900">Total: Rp ${x.total.toLocaleString()}</b>
                        <a href="${x.bukti}" target="_blank" class="text-xs bg-slate-100 p-2 rounded-lg font-bold">LIHAT BUKTI TF</a>
                    </div>
                    <p class="text-xs text-gray-500 mb-4">Item: ${x.items.map(i=>i.judul).join(', ')}</p>
                    <div class="flex flex-col gap-2">
                        <input id="link-${x._id}" placeholder="Tempel Link Download MediaFire Di Sini" class="p-3 border rounded-xl text-sm outline-none border-amber-200">
                        <div class="flex gap-2">
                            <button onclick="acc('${x._id}')" class="flex-grow bg-green-600 text-white py-3 rounded-xl font-bold">SETUJUI & KIRIM LINK</button>
                            <button onclick="delO('${x._id}')" class="bg-red-600 text-white px-6 rounded-xl font-bold">TOLAK</button>
                        </div>
                    </div>
                </div>`).join('') || '<p class="text-gray-400 italic">Belum ada pesanan masuk.</p>'}
        </div>

        <h3 class="font-bold mb-4">Katalog</h3>
        <div class="bg-white rounded-[2rem] overflow-hidden shadow-sm">
            ${b.map(x => `
                <div class="flex items-center justify-between p-4 border-b">
                    <div class="flex items-center gap-4">
                        <img src="${x.gambar}" class="w-10 h-10 object-cover rounded-lg">
                        <span class="font-bold text-sm">${x.judul}</span>
                    </div>
                    <button onclick="delB('${x._id}')" class="text-red-500 font-bold">Hapus</button>
                </div>`).join('')}
        </div>
    </div>

    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "MENGUNGGAH..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const link = document.getElementById('link-'+id).value;
            if(!link) return alert("Tempel link MediaFire dulu!");
            await fetch('/admin/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({downloadLink: link}) });
            alert("Berhasil disetujui!");
            location.reload();
        }
        async function delO(id){ if(confirm('Tolak pesanan?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        async function delB(id){ if(confirm('Hapus buku?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.downloadLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

