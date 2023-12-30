const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2');
const session = require('express-session');
const dbConfig= require('./konfiguracija.js');
const fs = require('fs'); 

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
const db = pool.promise();

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
  dbConfig.query('SELECT * FROM user_ips ORDER BY login_time DESC')
    .then(([rows]) => {
      res.json(rows);
    })
    .catch(err => {
      console.error('Error retrieving IP addresses from the database:', err.message);
      res.status(500).json({ message: 'Internal Server Error' });
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
  console.log(req.body);
  const file = req.file; // req.file is the multer file object
  console.log("Licnost: " ,licnost);
  console.log(tipFajla);
  console.log(file.filename);
  if (Array.isArray(licnost)) {
    licnost = licnost[0];
}
  // Use file.filename to get the name of the file on the disk
  const query = `
    INSERT INTO osobe.fileovi (filePath, LjudiId, fileType)
    VALUES (?, ?, ?)
  `;

  db.execute(query, [file.filename, licnost, tipFajla])
    .then(() => {
      res.status(201).json({ message: 'File uploaded and added to database successfully!', filename: file.filename });
    })
    .catch(err => {
      console.error('Error adding file to the database:', err.message);
      res.status(500).json({ message: 'Error occurred while adding the file to the database.' });
    });
});

app.post('/admin/dodaj', upload.single('slika'), (req, res) => {
  const { ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti, opis } = req.body;
  const slikaUrl = req.file ? req.file.filename : null;

  // Log statements for debugging
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

  dbConfig.execute(query, [ime, prezime, datumRodjenja, mjestoRodjenja, datumSmrti || null, slikaUrl, opis])
    .then(([result]) => {
      res.status(201).json({ message: 'Osoba dodana uspješno!', novaOsoba: result.insertId });
    })
    .catch(err => {
      console.error('Greška prilikom dodavanja osobe:', err.message);
      res.status(500).json({ message: 'Došlo je do greške prilikom dodavanja osobe.' });
    });
});



app.get('/ljudi', (req, res) => {
  const query = 'SELECT * FROM ljudi';

  dbConfig.query(query)
    .then(([rows]) => {
      res.json(rows);
    })
    .catch(err => {
      console.error('Greška prilikom dohvata svih ljudi:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata svih ljudi.' });
    });
});


app.get('/zadnjih_11',(req,res)=>{
  const query  = 'SELECT * FROM ljudi ORDER BY id DESC LIMIT 11';
  db.execute(query, (err, rows) => {
    if (err) {
      console.error('Greška prilikom dohvata svih ljudi:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata svih ljudi.' });
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

  dbConfig.execute(deleteQuery)
    .then(() => {
      // Nakon brisanja, unesemo novu osobu mjeseca
      const insertQuery = 'INSERT INTO osobaMjeseca (osobaId) VALUES (?)';
      return dbConfig.execute(insertQuery, [osobaId]);
    })
    .then(() => {
      res.status(201).json({ message: 'Osoba mjeseca je uspješno ažurirana!' });
    })
    .catch(err => {
      console.error('Greška prilikom ažuriranja osobe mjeseca:', err.message);
      res.status(500).json({ message: 'Došlo je do greške prilikom ažuriranja osobe mjeseca.' });
    });
});

app.get('/osobaMjeseca', (req, res) => {
  const queryOsobaMjeseca = 'SELECT osobaId FROM osobaMjeseca ORDER BY id DESC LIMIT 1';

  db.execute(queryOsobaMjeseca)
    .then(([rows]) => {
      // Provjerite postoji li rezultat
      if (rows.length > 0) {
        const osobaId = rows[0].osobaId;
        const queryOsoba = 'SELECT * FROM ljudi WHERE id = ?';

        return db.execute(queryOsoba, [osobaId]);
      } else {
        res.status(404).json({ message: 'Osoba mjeseca nije pronađena.' });
        return Promise.reject('Osoba mjeseca nije pronađena.');
      }
    })
    .then(([rows]) => {
      res.json(rows[0] || {});
    })
    .catch(err => {
      if (err !== 'Osoba mjeseca nije pronađena.') {
        console.error('Greška prilikom dohvata osobe mjeseca:', err);
        res.status(500).json({ message: 'Došlo je do greške prilikom dohvata osobe mjeseca.' });
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

  db.execute(query, [osobaId], (err, rows) => {
    if (err) {
      console.error('Greška prilikom dohvata fajlova za osobu:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata fajlova za osobu.' });
    } else {
      res.json(rows);
    }
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
  dbConfig.execute(insertQuery, featuredIds)
    .then(() => {
      res.status(201).json({ message: 'Istaknute osobe su uspješno odabrane i spremljene!' });
    })
    .catch(err => {
      console.error('Greška prilikom spremanja istaknutih osoba:', err.message);
      res.status(500).json({ message: 'Došlo je do greške prilikom spremanja istaknutih osoba.' });
    });
});

app.get('/get_featured_persons', (req, res) => {
  const query = 'SELECT * FROM featuredPersons ORDER BY id DESC LIMIT 1';

  dbConfig.execute(query)
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Istaknute osobe nisu pronađene.' });
      }

      // Dohvat ID-ova istaknutih osoba
      const featuredIds = rows[0];
      const personIds = [featuredIds.person1_id, featuredIds.person2_id, featuredIds.person3_id, featuredIds.person4_id];

      // Kreiranje upita za dohvat detalja svake istaknute osobe
      const detailsQuery = 'SELECT * FROM ljudi WHERE id IN (?, ?, ?, ?)';

      return dbConfig.execute(detailsQuery, personIds);
    })
    .then(([persons]) => {
      res.json(persons);
    })
    .catch(err => {
      console.error('Greška prilikom dohvata detalja istaknutih osoba:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata detalja istaknutih osoba.' });
    });
});

app.post('/dodaj-fajl', upload.single('file'), (req, res) => {
  // Now, req.file contains the modified filename
  const { licnost, tipFajla } = req.body;
  const file = req.file; // req.file is the multer file object

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const query = `
    INSERT INTO osobe.fileovi (filePath, LjudiId, fileType)
    VALUES (?, ?, ?)
  `;

  // Use file.filename to get the name of the file on the disk
  db.execute(query, [file.filename, licnost, tipFajla], function (err) {
    if (err) {
      console.error('Error adding file:', err.message);
      res.status(500).json({ message: 'Error occurred while adding the file.' });
    } else {
      res.status(201).json({ message: 'File added successfully!', newFileId: this.lastID });
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

  dbConfig.execute(excludeQuery)
    .then(([excludedIds]) => {
      const excludedIdsList = excludedIds.map(row => row.osobaId);

      if (excludedIdsList.length === 0) {
        // Ako nema isključenih ID-ova, samo dohvatite nedavne osobe
        const recentPersonsQuery = `
          SELECT * FROM ljudi
          ORDER BY id DESC
          LIMIT 6
        `;
        return dbConfig.execute(recentPersonsQuery);
      } else {
        // Ako ima isključenih ID-ova, koristite ih u upitu
        const recentPersonsQuery = `
          SELECT * FROM ljudi
          WHERE id NOT IN (${excludedIdsList.join(", ")})
          ORDER BY id DESC
          LIMIT 6
        `;
        return dbConfig.execute(recentPersonsQuery);
      }
    })
    .then(([recentPersons]) => {
      res.json(recentPersons);
    })
    .catch(err => {
      console.error('Greška prilikom dohvata nedavnih osoba:', err);
      res.status(500).json({ message: 'Došlo je do greške prilikom dohvata nedavnih osoba.' });
    });
});

app.get('/osoba/:id', async (req, res) => {
  const osobaId = req.params.id;

  try {
    const [osoba] = await db.execute('SELECT * FROM ljudi WHERE id = ?', [osobaId]);
    if (osoba.length === 0) {
      return res.status(404).json({ message: 'Osoba nije pronađena.' });
    }

    const [fajlovi] = await db.execute('SELECT * FROM fileovi WHERE LjudiId = ?', [osobaId]);
    // Combine the person data with their files into one JSON object
    const result = {
      ...osoba[0],
      fajlovi: fajlovi
    };

    res.json(result);
  } catch (err) {
    console.error('Greška prilikom dohvata osobe:', err);
    res.status(500).json({ message: 'Došlo je do greške prilikom dohvata osobe.' });
  }
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

app.get('/api/osoba/:id', async (req, res) => {
  const osobaId = req.params.id;

  try {
    const [osoba] = await db.execute('SELECT * FROM ljudi WHERE id = ?', [osobaId]);
    if (osoba.length === 0) {
      return res.status(404).json({ message: 'Osoba nije pronađena.' });
    }
    res.json(osoba[0]);
  } catch (err) {
    console.error('Greška prilikom dohvata osobe:', err);
    res.status(500).json({ message: 'Došlo je do greške prilikom dohvata osobe.' });
  }
});

app.post('/admin/delete', async (req, res) => {
  const { ids } = req.body; // ids should be an array of person IDs

  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: 'No IDs provided' });
  }

  try {
    // The query should be structured to match the number of IDs
    const placeholders = ids.map(() => '?').join(', ');
    const query = `DELETE FROM ljudi WHERE id IN (${placeholders})`;

    await db.execute(query, ids);
    res.json({ message: 'Persons deleted successfully' });
  } catch (err) {
    console.error('Error deleting persons:', err.message);
    res.status(500).json({ message: 'Error occurred during deletion' });
  }
});

app.get('/search', (req, res) => {
  const searchTerm = req.query.q;
  
  // Protect against SQL injection
  const query = `
      SELECT * FROM ljudi 
      WHERE ime LIKE ? OR prezime LIKE ? OR mjestoRodjenja LIKE ? OR YEAR(datumRodjenja) LIKE ?
  `;

  dbConfig.execute(query, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`])
      .then(([results]) => {
          res.json(results);
      })
      .catch(err => {
          console.error('Search error:', err);
          res.status(500).json({ message: 'Error occurred during search.' });
      });
});

app.get('/podstranica/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'podstranica.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
