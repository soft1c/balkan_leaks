const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3');


const uploadDir = path.join(__dirname, 'uploads/media');

const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');
const audioDir = path.join(uploadDir, 'audio');
const textDir = path.join(uploadDir, 'text');

app.use(express.urlencoded({ extended: true })); 


const db = new sqlite3.Database(path.join(__dirname, 'baza.db'), (err) => {
  if (err) {
    console.error('Greška prilikom povezivanja s bazom:', err.message);
  } else {
    console.log('Veza s bazom uspostavljena uspješno.');
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    switch (req.params.type) {
      case 'image':
        uploadPath = imageDir;
        break;
      case 'video':
        uploadPath = videoDir;
        break;
      case 'audio':
        uploadPath = audioDir;
        break;
      case 'text':
        uploadPath = textDir;
        break;
      default:
        // Ako type nije postavljen ili nije prepoznat, koristi 'images' direktorij
        uploadPath = imageDir;
        break;
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/upload/:type', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const mediaType = req.params.type;
  res.json({ message: `${mediaType} uploaded successfully!`, filename: req.file.filename });
});

app.post('/admin/dodaj', upload.single('slika'), (req, res) => {
  const { ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti } = req.body;
  const slikaUrl = req.file ? req.file.filename : null;
  console.log(slikaUrl);
  console.log(req.body);
  console.log(ime);
  console.log(prezime);
  console.log(datumRodjenja);
  console.log(mjestoRodjenja);
  console.log(datumSmrti);
  console.log(slikaUrl);

  const query = `
    INSERT INTO ljudi (ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti, slikaUrl)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti || null, slikaUrl], function (err) {
    if (err) {
      console.error('Greška prilikom dodavanja osobe:', err.message);
      res.status(500).json({ message: 'Došlo je do greške prilikom dodavanja osobe.' });
    } else {
      res.status(201).json({ message: 'Osoba dodana uspješno!', novaOsoba: this.lastID });
    }
  });
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
