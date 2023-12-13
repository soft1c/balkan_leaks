const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3');

const fileTypeToDir = {
  image: 'images',
  video: 'videos',
  audio: 'audio',
  text: 'text',
};


// Dodaj middleware za serviranje statičkih fajlova

const uploadDir = path.join(__dirname, 'uploads/media');
app.use('/uploads/media', express.static(uploadDir));
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
  const { ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti,opis } = req.body;
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
    INSERT INTO ljudi (ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti, slikaUrl, opis)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti || null, slikaUrl, opis], function (err) {
    if (err) {
      console.error('Greška prilikom dodavanja osobe:', err.message);
      res.status(500).json({ message: 'Došlo je do greške prilikom dodavanja osobe.' });
    } else {
      res.status(201).json({ message: 'Osoba dodana uspješno!', novaOsoba: this.lastID });
    }
  });
});


app.get('/ljudi', (req, res) => {
  const query = 'SELECT * FROM ljudi';

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Greška prilikom dohvata svih ljudi:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata svih ljudi.' });
    } else {
      res.json(rows);
    }
  });
});

app.get('/zadnjih_6',(req,res)=>{
  const query  = 'SELECT * FROM ljudi ORDER BY id DESC LIMIT 6';
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Greška prilikom dohvata svih ljudi:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata svih ljudi.' });
    } else {
      res.json(rows);
    }
  });
});



app.get('/get_file/:id', (req, res) => {
  const osobaId = req.params.id;

  const query = `
    SELECT fileovi.*, ljudi.ime, ljudi.prezime
    FROM fileovi
    JOIN ljudi ON fileovi.ljudiId = ljudi.id
    WHERE ljudi.id = ?;
  `;

  db.all(query, [osobaId], (err, rows) => {
    if (err) {
      console.error('Greška prilikom dohvata fajlova za osobu:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata fajlova za osobu.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/dodaj-fajl', upload.single('file'), (req, res) => {
  console.log(req.body);
  const { licnost, tipFajla ,file} = req.body;

  const query = `
    INSERT INTO fileovi (filePath,LjudiId,fileType)
    VALUES (?, ?, ?)
  `;

  db.run(query, [file, licnost, tipFajla], function (err) {
    if (err) {
      console.error('Greška prilikom dodavanja fajla:', err.message);
      res.status(500).json({ message: 'Došlo je do greške prilikom dodavanja fajla.' });
    } else {
      res.status(201).json({ message: 'Fajl dodan uspješno!', noviFajl: this.lastID });
    }
  });
});

app.get('/osoba/:id', (req, res) => {
  const osobaId = req.params.id;

  // Dohvati osnovne informacije o osobi
  const osobaQuery = 'SELECT * FROM ljudi WHERE id = ?';
  db.get(osobaQuery, [osobaId], (err, osoba) => {
    if (err) {
      console.error('Greška prilikom dohvata osobe:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata osobe.' });
    } else {
      if (!osoba) {
        res.status(404).json({ message: 'Osoba nije pronađena.' });
      } else {
        // Dohvati fajlove vezane za osobu
        const fajloviQuery = 'SELECT * FROM fileovi WHERE LjudiId = ?';
        db.all(fajloviQuery, [osobaId], (err, fajlovi) => {
          if (err) {
            console.error('Greška prilikom dohvata fajlova za osobu:', err);
            res.status(500).json({ message: 'Došlo je do greške prilikom dohvata fajlova za osobu.' });
          } else {
            // Prikazi HTML stranicu sa detaljima osobe i povezanim fajlovima
            res.send(`
            <h1>${osoba.ime} ${osoba.prezime}</h1>
            <p>Datum rođenja: ${osoba.datumRodjenja}</p>
            <p>Mjesto rođenja: ${osoba.mjestoRodjenja}</p>
            <p>Datum smrti: ${osoba.datumSmrti || 'N/A'}</p>
            <p>Opis: ${osoba.opis || 'Nema opisa.'}</p>
            <img src="/uploads/media/images/${osoba.slikaUrl}" alt="${osoba.ime} ${osoba.prezime}">
            <h2>Fajlovi:</h2>
            <ul>
              ${fajlovi.map(fajl => {
                const dirName = fileTypeToDir[fajl.fileType] || 'unknown';
                return `<li><a href="/uploads/media/${dirName}/${fajl.filePath}" download>${fajl.fileType} - ${fajl.filePath}</a></li>`;
              }).join('')}
            </ul>
            `);
          }
        });

      
      }
    }
  });
});

app.get('/uploads/media/:type/:filePath', (req, res) => {
  const type = req.params.type;
  const filePath = req.params.filePath;
  const absolutePath = path.join(__dirname, 'uploads/media', type, filePath);

  // Postavljanje HTTP zaglavlja za preuzimanje fajla
  res.setHeader('Content-disposition', 'attachment; filename=' + filePath);

  // Postavljanje odgovarajućeg Content-type zaglavlja na osnovu tipa fajla
  let contentType;
  switch (type) {
    case 'images':
      contentType = 'image/*';
      break;
    case 'videos':
      contentType = 'video/*';
      break;
    case 'audio':
      contentType = 'audio/*';
      break;
    case 'text':
      contentType = 'text/plain';
      break;
    default:
      contentType = 'application/octet-stream';
      break;
  }
  res.setHeader('Content-type', contentType);

  // Slanje fajla kao odgovor
  res.sendFile(absolutePath);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
