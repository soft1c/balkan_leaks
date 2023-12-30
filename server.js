const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2');
const session = require('express-session');
const dbConfig= require('./konfiguracija.js');
const fs = require('fs'); 
const sqlite3= require('sqlite3').verbose();

const db = new sqlite3.Database('./baza.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
      console.error(err.message);
      throw err;
  } else {
      console.log('Connected to the SQLite database.');
      // Ovdje možete izvršiti početne SQL upite za inicijalizaciju, ako je potrebno
  }
});

app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json());
// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'admin',
  database: 'osobe',
  password: 'password'
});

// Promisify for Node.js async/await.
//const db = pool.promise();

const fileTypeToDir = {
  image: 'images',
  video: 'videos',
  audio: 'audio',
  text: 'text',
};

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

app.use(express.urlencoded({ extended: true }));


/* const ip_adrese = new sqlite3.Database('user_ips.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the database.');
    db.execute(`
      CREATE TABLE IF NOT EXISTS user_ips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}); */

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);

  // Validate credentials
  // For example purposes, using hardcoded credentials. Replace with your authentication logic.
  if(username === 'admin' && password === 'password') {
      req.session.loggedIn = true;
      res.redirect('/admin');
  } else {
      res.send('Invalid username or password');
  }
});


app.use((req, res, next) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.session.ipAddress = ipAddress;
  next();
});

app.get('/user_ips', (req, res) => {
  const query = 'SELECT * FROM user_ips ORDER BY login_time DESC';
  db.all(query, [], (err, rows) => {
      if (err) {
          console.error('Error retrieving IP addresses from the database:', err.message);
          res.status(500).json({ message: 'Internal Server Error' });
      } else {
          res.json(rows);
      }
  });
});




const uploadDir = path.join(__dirname, 'uploads/media');
app.use('/uploads/media', express.static(uploadDir));
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');
const audioDir = path.join(uploadDir, 'audio');
const textDir = path.join(uploadDir, 'text');

app.use(express.urlencoded({ extended: true })); 



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    switch (req.params.type) {
      case 'image':
        uploadPath = path.join(__dirname, 'public', 'uploads', 'media', 'images');
        break;
      case 'video':
        uploadPath = path.join(__dirname, 'public', 'uploads', 'media', 'videos');
        break;
      case 'audio':
        uploadPath = path.join(__dirname, 'public', 'uploads', 'media', 'audio');
        break;
      case 'text':
        uploadPath = path.join(__dirname, 'public', 'uploads', 'media', 'text');
        break;
      default:
        uploadPath = path.join(__dirname, 'public', 'uploads', 'media', 'images');
        break;
    }
    // Ensure the directory exists or create it
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Replace spaces with hyphens
    const sanitizedFilename = file.originalname.replace(/\s+/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, sanitizedFilename + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  if(req.session.loggedIn) {
      res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
      res.redirect('/login');
  }
});

app.post('/upload/:type', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  // Extract additional data from request
  let { licnost, tipFajla } = req.body;
  const file = req.file; // req.file is the multer file object

  // Handle case where 'licnost' is an array
  if (Array.isArray(licnost)) {
    licnost = licnost[0];
  }

  const query = 'INSERT INTO fileovi (filePath, LjudiId, fileType) VALUES (?, ?, ?)';
  db.run(query, [file.filename, licnost, tipFajla], function(err) {
    if (err) {
      console.error('Error adding file to the database:', err.message);
      res.status(500).json({ message: 'Error occurred while adding the file to the database.' });
    } else {
      res.status(201).json({ message: 'File uploaded and added to database successfully!', filename: file.filename });
    }
  });
});

app.post('/admin/dodaj', upload.single('slika'), (req, res) => {
  const { ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti, opis } = req.body;
  const slikaUrl = req.file ? req.file.filename : null;

  // Log statements for debugging
  console.log('Dodavanje nove osobe:', ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti, slikaUrl, opis);

  const query = 'INSERT INTO ljudi (ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti, slikaUrl, opis) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.run(query, [ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti || null, slikaUrl, opis], function(err) {
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
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Greška prilikom dohvata svih ljudi:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata svih ljudi.' });
    } else {
      res.json(rows);
    }
  });
});



app.get('/zadnjih_11', (req, res) => {
  const query = 'SELECT * FROM ljudi ORDER BY id DESC LIMIT 11';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Greška prilikom dohvata zadnjih 11 ljudi:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata zadnjih 11 ljudi.' });
    } else {
      res.json(rows);
    }
  });
});


app.get('/podstranica', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'podstranica.html'));
})

app.post('/odaberi-osobu-mjeseca', (req, res) => {
  const { osobaId } = req.body;
  console.log(osobaId);

  // Prvo brišemo prethodnu osobu mjeseca
  const deleteQuery = 'DELETE FROM osobaMjeseca';

  db.run(deleteQuery, [], function(err) {
    if (err) {
      console.error('Greška prilikom brisanja prethodne osobe mjeseca:', err.message);
      return res.status(500).json({ message: 'Došlo je do greške prilikom brisanja prethodne osobe mjeseca.' });
    }

    // Nakon brisanja, unesemo novu osobu mjeseca
    const insertQuery = 'INSERT INTO osobaMjeseca (osobaId) VALUES (?)';
    db.run(insertQuery, [osobaId], function(err) {
      if (err) {
        console.error('Greška prilikom ažuriranja osobe mjeseca:', err.message);
        return res.status(500).json({ message: 'Došlo je do greške prilikom ažuriranja osobe mjeseca.' });
      }

      res.status(201).json({ message: 'Osoba mjeseca je uspješno ažurirana!' });
    });
  });
});


app.get('/osobaMjeseca', (req, res) => {
  const queryOsobaMjeseca = 'SELECT osobaId FROM osobaMjeseca ORDER BY id DESC LIMIT 1';

  db.get(queryOsobaMjeseca, [], (err, row) => {
    if (err) {
      console.error('Greška prilikom dohvata osobe mjeseca:', err);
      return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata osobe mjeseca.' });
    }

    // Provjerite postoji li rezultat
    if (row) {
      const osobaId = row.osobaId;
      const queryOsoba = 'SELECT * FROM ljudi WHERE id = ?';

      db.get(queryOsoba, [osobaId], (err, osoba) => {
        if (err) {
          console.error('Greška prilikom dohvata osobe:', err);
          return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata osobe.' });
        }

        res.json(osoba || {});
      });
    } else {
      res.status(404).json({ message: 'Osoba mjeseca nije pronađena.' });
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
      return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata fajlova za osobu.' });
    }
    
    res.json(rows);
  });
});

app.post('/odaberi-istaknute-osobe', (req, res) => {
  const { featuredIds } = req.body;

  // Provjeravamo jesu li svi ID-ovi prisutni
  if (featuredIds.length !== 4 || featuredIds.some(id => !id)) {
    return res.status(400).json({ message: 'Nedostaju ID-ovi istaknutih osoba.' });
  }

  // SQL upit za umetanje novih ID-ova istaknutih osoba
  const insertQuery = `
    INSERT INTO featuredPersons (person1_id, person2_id, person3_id, person4_id)
    VALUES (?, ?, ?, ?)
  `;

  // Izvršavanje upita
  db.run(insertQuery, featuredIds, function(err) {
    if (err) {
      console.error('Greška prilikom spremanja istaknutih osoba:', err.message);
      return res.status(500).json({ message: 'Došlo je do greške prilikom spremanja istaknutih osoba.' });
    }

    res.status(201).json({ message: 'Istaknute osobe su uspješno odabrane i spremljene!' });
  });
});


app.get('/get_featured_persons', (req, res) => {
  const query = 'SELECT * FROM featuredPersons ORDER BY id DESC LIMIT 1';

  db.get(query, (err, row) => {
    if (err) {
      console.error('Greška prilikom dohvata istaknutih osoba:', err);
      return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata istaknutih osoba.' });
    }

    if (!row) {
      return res.status(404).json({ message: 'Istaknute osobe nisu pronađene.' });
    }

    // Dohvat ID-ova istaknutih osoba
    const featuredIds = row;
    const personIds = [featuredIds.person1_id, featuredIds.person2_id, featuredIds.person3_id, featuredIds.person4_id];

    // Kreiranje upita za dohvat detalja svake istaknute osobe
    const detailsQuery = 'SELECT * FROM ljudi WHERE id IN (?, ?, ?, ?)';
    
    db.all(detailsQuery, personIds, (err, persons) => {
      if (err) {
        console.error('Greška prilikom dohvata detalja istaknutih osoba:', err);
        return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata detalja istaknutih osoba.' });
      }
      
      res.json(persons);
    });
  });
});


app.post('/dodaj-fajl', upload.single('file'), (req, res) => {
  // Sada req.file sadrži modifikovano ime datoteke
  const { licnost, tipFajla } = req.body;
  const file = req.file; // req.file je multer objekat datoteke

  if (!file) {
    return res.status(400).json({ message: 'Nije uploadovana datoteka.' });
  }

  const query = `
    INSERT INTO fileovi (filePath, LjudiId, fileType)
    VALUES (?, ?, ?)
  `;

  // Koristimo file.filename da dobijemo ime datoteke na disku
  db.run(query, [file.filename, licnost, tipFajla], function (err) {
    if (err) {
      console.error('Greška prilikom dodavanja datoteke:', err.message);
      res.status(500).json({ message: 'Došlo je do greške prilikom dodavanja datoteke.' });
    } else {
      res.status(201).json({ message: 'Datoteka je uspješno dodana!', newFileId: this.lastID });
    }
  });
});



app.get('/get_recent_persons', (req, res) => {
  const excludeQuery = `
    SELECT osobaId FROM osobaMjeseca
    UNION
    SELECT person1_id AS osobaId FROM featuredPersons
    UNION
    SELECT person2_id AS osobaId FROM featuredPersons
    UNION
    SELECT person3_id AS osobaId FROM featuredPersons
    UNION
    SELECT person4_id AS osobaId FROM featuredPersons
  `;

  db.all(excludeQuery, [], (err, excludedRows) => {
    if (err) {
      console.error('Greška prilikom dohvata isključenih ID-ova:', err);
      return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata isključenih ID-ova.' });
    }

    const excludedIdsList = excludedRows.map(row => row.osobaId);
    let recentPersonsQuery;

    if (excludedIdsList.length === 0) {
      recentPersonsQuery = `
        SELECT * FROM ljudi
        ORDER BY id DESC
        LIMIT 6
      `;
    } else {
      recentPersonsQuery = `
        SELECT * FROM ljudi
        WHERE id NOT IN (${excludedIdsList.join(", ")})
        ORDER BY id DESC
        LIMIT 6
      `;
    }

    db.all(recentPersonsQuery, [], (err, recentPersonsRows) => {
      if (err) {
        console.error('Greška prilikom dohvata nedavnih osoba:', err);
        return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata nedavnih osoba.' });
      }

      res.json(recentPersonsRows);
    });
  });
});


app.get('/daj_sve',(req,res)=>{
  db.all('SELECT * FROM ljudi',[],(err,rows)=>{
    if(err){
      console.error('Greška prilikom dohvata svih osoba:', err);
      return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata svih osoba.' });
    }
    res.json(rows);
  })
});


app.get('/osoba/:id', (req, res) => {
  const osobaId = req.params.id;

  db.get('SELECT * FROM ljudi WHERE id = ?', [osobaId], (err, osoba) => {
    if (err) {
      console.error('Greška prilikom dohvata osobe:', err);
      return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata osobe.' });
    }

    if (!osoba) {
      return res.status(404).json({ message: 'Osoba nije pronađena.' });
    }

    db.all('SELECT * FROM fileovi WHERE LjudiId = ?', [osobaId], (err, fajlovi) => {
      if (err) {
        console.error('Greška prilikom dohvata fajlova za osobu:', err);
        return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata fajlova za osobu.' });
      }

      // Kombinujte podatke o osobi s njihovim datotekama u jedan JSON objekat
      const result = {
        ...osoba,
        fajlovi: fajlovi
      };

      res.json(result);
    });
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

app.get('/api/osoba/:id', (req, res) => {
  const osobaId = req.params.id;

  db.get('SELECT * FROM ljudi WHERE id = ?', [osobaId], (err, osoba) => {
    if (err) {
      console.error('Greška prilikom dohvata osobe:', err);
      return res.status(500).json({ message: 'Došlo je do greške prilikom dohvata osobe.' });
    }

    if (!osoba) {
      return res.status(404).json({ message: 'Osoba nije pronađena.' });
    }

    res.json(osoba);
  });
});


app.post('/admin/delete', (req, res) => {
  const { ids } = req.body; // ids should be an array of person IDs

  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: 'No IDs provided' });
  }

  // The query should be structured to match the number of IDs
  const placeholders = ids.map(() => '?').join(', ');
  const query = `DELETE FROM ljudi WHERE id IN (${placeholders})`;

  db.run(query, ids, function(err) {
    if (err) {
      console.error('Error deleting persons:', err.message);
      return res.status(500).json({ message: 'Error occurred during deletion' });
    }

    res.json({ message: 'Persons deleted successfully', deleted: this.changes });
  });
});


app.get('/search', (req, res) => {
  const searchTerm = req.query.q;

  // Protect against SQL injection
  const query = `
    SELECT * FROM ljudi 
    WHERE ime LIKE ? OR prezime LIKE ? OR mjestoRodjenja LIKE ? OR strftime('%Y', datumRodjenja) LIKE ?
  `;

  db.all(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`], (err, rows) => {
    if (err) {
      console.error('Search error:', err);
      return res.status(500).json({ message: 'Error occurred during search.' });
    }
    res.json(rows);
  });
});


app.get('/podstranica/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'podstranica.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
