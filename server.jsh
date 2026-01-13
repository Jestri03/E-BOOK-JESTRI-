const express = require('express');
const app = express();

app.set('view engine', 'ejs');

// Halaman Utama
app.get('/', (req, res) => { res.render('index'); });

// HALAMAN WATERMARK LAB (Pastikan bagian ini ADA)
app.get('/jestri-lab', (req, res) => {
    res.render('lab');
});

module.exp
