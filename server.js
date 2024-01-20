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
const cookieParser = require('cookie-parser');

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

app.use(cookieParser());
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

function logVisit(req, res, next) {
  if (!req.cookies.visited) {
    
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const loginTime = new Date().toISOString();
    console.log(ip);
    console.log(loginTime);

    db.run(`INSERT INTO visits (ip, loginTime) VALUES (?, ?)`, [ip, loginTime], function(err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`A visit from ${ip} was logged.`);
    });
    res.cookie('visited', 'yes', { maxAge: 1000000 }); 
  }

  next();
}

app.use(logVisit);

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Provjeravanje da li su uneseni kredencijali za ownera
  db.get('SELECT * FROM owners WHERE username = ? AND password = ?', [username, password], (ownerErr, ownerRow) => {
    if (ownerErr) {
      console.error(ownerErr);
      res.status(500).send('Server error');
    } else if (ownerRow) {
      console.log('Owner logged in');
      req.session.role = 'owner';
      req.session.username= username;
      req.session.loggedIn = true;
      res.redirect('/admin');
    } else {
      // Ako owner kredencijali nisu pronađeni, provjerava se tabela admini
      db.get('SELECT * FROM admini WHERE username = ? AND password = ?', [username, password], (adminErr, adminRow) => {
        if (adminErr) {
          console.error(adminErr);
          res.status(500).send('Server error');
        } else if (adminRow) {
          console.log('Admin logged in');
          req.session.role = 'admin';
          req.session.username= username;
          req.session.loggedIn = true;
          res.redirect('/admin');
        } else {
          // Ako ni admin kredencijali nisu pronađeni, provjerava se tabela moderators
          db.get('SELECT * FROM moderatori WHERE username = ? AND password = ?', [username, password], (modErr, modRow) => {
            if (modErr) {
              console.error(modErr);
              res.status(500).send('Server error');
            } else if (modRow) {
              console.log('Moderator logged in');
              req.session.role = 'moderator';
              req.session.username= username;
              req.session.loggedIn = true;
              res.redirect('/admin');
            } else {
              // Ako ni owner, ni admin, ni moderator kredencijali nisu pronađeni, vraća se greška
              res.send('Invalid username or password');
            }
          });
        }
      });
    }
  });
});

app.get('/get-role', (req, res) => {
  if (req.session.role) {
    res.json({ role: req.session.role });
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});


app.use((req, res, next) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.session.ipAddress = ipAddress;
  next();
});

app.get('/user_ips', (req, res) => {
  const query = 'SELECT * FROM visits ORDER BY loginTime DESC';
  db.all(query, [], (err, rows) => {
      if (err) {
          console.error('Error retrieving IP addresses from the database:', err.message);
          res.status(500).json({ message: 'Internal Server Error' });
      } else {

          res.json(rows);
      }
  });
});


app.get('/record-entry', (req, res) => {
  db.run('INSERT INTO user_entries (timestamp) VALUES (CURRENT_TIMESTAMP)', [], (err) => {
    if (err) {
      res.status(500).send('Error recording entry');
    } else {
      res.status(200).send('Entry recorded');
    }
  });
});


app.get('/visit-counts', function(req, res) {
  const totalVisitsQuery = "SELECT COUNT(*) AS total FROM visits;";
  const dailyVisitsQuery = "SELECT COUNT(*) AS today FROM visits WHERE date(loginTime) = date('now');";
  const weeklyVisitsQuery = "SELECT COUNT(*) AS last_week FROM visits WHERE date(loginTime) >= date('now', '-7 days');";

  // Assuming you are using sqlite3 and db is your database instance
  db.serialize(() => {
      db.get(totalVisitsQuery, (err, totalResult) => {
          if (err) {
              console.error('Error fetching total visits:', err);
              return res.status(500).send('Error fetching total visits');
          }
          db.get(dailyVisitsQuery, (err, dailyResult) => {
              if (err) {
                  console.error('Error fetching daily visits:', err);
                  return res.status(500).send('Error fetching daily visits');
              }
              db.get(weeklyVisitsQuery, (err, weeklyResult) => {
                  if (err) {
                      console.error('Error fetching weekly visits:', err);
                      return res.status(500).send('Error fetching weekly visits');
                  }
                  res.json({
                      total: totalResult.total,
                      today: dailyResult.today,
                      last_week: weeklyResult.last_week
                  });
              });
          });
      });
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
  const { ime, prezime, opis1 } = req.body;
  console.log(req.body);
  const slikaUrl = req.file ? req.file.filename : null;

  // Log statements for debugging
  console.log('Dodavanje nove osobe:', ime, prezime, slikaUrl, opis1);

  const query = 'INSERT INTO ljudi (ime, prezime, slikaUrl, opis) VALUES (?, ?, ?, ?)';
  db.run(query, [ime, prezime, slikaUrl, opis1], function(err) {
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


app.get('/about-us',(req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'about-us.html'));
})


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

app.post('/admin/addAdmin',(req,res)=>{
  console.log(req.body);
  const {username, password} = req.body;
  const insertQuery = 'INSERT INTO admini (username, password) VALUES (?, ?)';
  db.run(insertQuery, [username, password], function(err) {
    if (err) {
      console.error('Greška prilikom dodavanja admina:', err.message);

    } else {
      res.status(200).send({message: 'Admin added successfully', changes: this.changes});
    }
});
});

app.post('/admin/deleteAdmin', (req, res) => {
  const { id } = req.body;
  db.run('DELETE FROM admini WHERE id = ?', [id], function(err) {
    if(err){
      console.error('Error deleting admin:', err.message);
      res.status(500).send('Error deleting admin');
    }else{
      res.status(200).send({message: 'Admin deleted successfully', changes: this.changes});
    }
  });

});


app.get('/admini', (req, res) => {
  db.all('SELECT * FROM admini', (err, rows) => {
    if(err){
      console.error('Error retrieving admins:', err.message);
      res.status(500).send('Error retrieving admins');
    }else{
      res.status(200).send(rows);
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
  console.log(searchTerm);
  // Protect against SQL injection
  const query = `
    SELECT * FROM ljudi 
    WHERE ime LIKE ? OR prezime LIKE ?
  `;

  db.all(query, [`%${searchTerm}%`, `%${searchTerm}%`], (err, rows) => {
    if (err) {
      console.error('Search error:', err);
      return res.status(500).json({ message: 'Error occurred during search.' });
    }
    console.log(rows);
    res.json(rows);
  });
});

app.post('/admin/update/:id', upload.single('slika'), (req, res) => {
  const osobaId = req.params.id;
  const { ime, prezime, opis } = req.body;
  console.log(req.body);
  console.log('opis ', opis);
  let slikaUrl = req.file ? `${req.file.filename}` : null;

  let query = `UPDATE ljudi SET 
                 ime = ?,
                 prezime = ?, 
                 opis = ?
               WHERE id = ?`;
  
  let queryParams = [ime, prezime, opis, osobaId];

  // If a new image was uploaded, add it to the query and params
  if (slikaUrl) {
    query = `UPDATE ljudi SET 
               ime = ?,
               prezime = ?, 
               opis = ?, 
               slikaUrl = ?
             WHERE id = ?`;
    queryParams = [ime, prezime, opis, slikaUrl, osobaId]; // Note the order of parameters
  }

  db.run(query, queryParams, function(err) {
    if (err) {
      console.error('Error updating person:', err.message);
      res.status(500).send('Error updating person');
    } else {
      res.status(200).send({ message: 'Person updated successfully', changes: this.changes });
    }
  });
});


app.get('/podstranica/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'podstranica.html'));
});

app.get('/moderatori',(req,res)=>{
  db.all('SELECT * FROM moderatori', (err, rows) => {
    if(err){
      console.error('Error retrieving moderators:', err.message);
      res.status(500).send('Error retrieving moderators');
    }else{
      res.status(200).send(rows);
    }
  });
})

app.post('/admin/addModerator',(req,res)=>{
  const {username,password}=req.body;

  db.run('INSERT INTO moderatori (username, password) VALUES (?, ?)', [username, password], function(err) {
    if(err){
      console.error('Error adding moderator:', err.message);
      res.status(500).send('Error adding moderator');
    }else{
      res.status(200).send({message: 'Moderator added successfully', changes: this.changes});
    }
  });
});


app.post('/admin/deleteModerator', (req, res) => {
  const { id } = req.body; 
  console.log(id);// ids should be an array of moderator IDs
  db.run('DELETE FROM moderatori WHERE id IN (?)', [id], function(err) {
    if(err){
      console.error('Error deleting moderator:', err.message);
      res.status(500).send('Error deleting moderator');
    }else{
      res.status(200).send({message: 'Moderator deleted successfully', changes: this.changes});
    }
  });
});

app.post('/logout', function(req, res) {
  console.log('Logout');
  req.session.destroy(function(err) {
    if(err) {
      console.error('Došlo je do greške prilikom odjave:', err);
      return res.status(500).send('Došlo je do greške prilikom odjave');
    }
    res.clearCookie('connect.sid'); // Ovo je ime cookieja koje Express koristi za sesije
    res.redirect('/login.html');
  });
});

app.post('/obrisi_osobu', (req, res) => {
  const { id } = req.body;
  db.run('DELETE FROM ljudi WHERE id = ?', [id], function(err) {
    if(err){
      console.error('Error deleting person:', err.message);
      res.status(500).send('Error deleting person');
    }else{
      res.status(200).send({message: 'Person deleted successfully', changes: this.changes});
    }
  });
});

app.post('/change_password', (req, res) => {
    const { oldPassword, newPassword } = req.body;
    console.log(req.body);
    const username = req.session.username; // Pretpostavljamo da je korisničko ime spremljeno u sesiji
    const role = req.session.role; // Pretpostavljamo da je uloga korisnika spremljena u sesiji
    console.log(role,username);
    // Odredite ime tablice na temelju uloge
    let tableName;
    switch (role) {
      case 'owner':
        tableName = 'owners';
        break;
      case 'admin':
        tableName = 'admini';
        break;
      case 'moderator':
        tableName = 'moderatori';
        break;
      default:
        return res.status(401).send('Unauthorized access');
    }
  console.log(tableName );
    db.all(`SELECT password FROM ${tableName} WHERE username = ?`, [username], (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server error');
      }
      if (row && row.password === oldPassword) {
        // Ažurirajte lozinku
        db.all(`UPDATE ${tableName} SET password = ? WHERE username = ?`, [newPassword, username], (updateErr) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).send('Server error during password update');
          }
          res.send('Password updated successfully');
        });
      } else {
        res.send('Invalid old password');
      }
    });
  });
  app.post('/dodaj_vijest',(req,res)=>{
    console.log(req.body);
    const {naslov,tekst}=req.body;
    db.run('INSERT INTO vijesti (naziv,tekst) VALUES (?, ?)', [naslov,tekst], function(err) {
      if(err){
        console.error('Error adding news:', err.message);
        res.status(500).send('Error adding news');
      }else{
        res.status(200).send({message: 'News added successfully', changes: this.changes});
      }
    });
  });
  
  app.get('/vijesti',(req,res)=>{
    db.all('SELECT * FROM vijesti', (err, rows) => {
      if(err){
        console.error('Error retrieving news:', err.message);
        res.status(500).send('Error retrieving news');
      }else{
        res.status(200).send(rows);
      }
    });
  });

  app.post('/update-footer', upload.single('footerImage'), (req, res) => {
    console.log(req.file);
    
    const footerId = req.body.footerId;
    const tekst = req.body.footerText;
    console.log(tekst);

    let slikaUrl = req.file ? `${req.file.filename}` : null;
    slikaUrl='uploads/media/images/'+slikaUrl;
    let query = `UPDATE footer SET tekst = ? WHERE id = ?`;
  
    // Include slikaUrl in the update if a new image was uploaded
    if (slikaUrl) {
      query = `UPDATE footer SET tekst = ?, urlPath = ? WHERE id = ?`;
    }
  
    db.run(query, slikaUrl ? [tekst, slikaUrl, footerId] : [tekst, footerId], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Error updating footer');
      } else {
        console.log(`Row(s) updated: ${this.changes}`);
        res.send('Footer updated successfully');
      }
    });

  });

  app.post('/upload-sponsor', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).send('No image file uploaded.');
    }
  
    const imageUrl = path.join('uploads', 'media', 'images', req.file.filename); // Relativna putanja slike
    const linkUrl = req.body.link; // URL sponzora iz forme
    console.log(linkUrl, imageUrl);
    const query= `INSERT INTO sponzori (urlPath, link) VALUES (?, ?)`;
    db.run(query, [imageUrl, linkUrl], function(err) {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Error adding sponsor');
      }
      console.log(`Row(s) updated: ${this.changes}`);
  
      res.status(200).json({ message: 'Sponsor added successfully', imageUrl, linkUrl });
    });
  });

  app.get('/sponzori',(req,res)=>{
    db.all('SELECT * FROM sponzori', (err, rows) => {
      if(err){
        console.error('Error retrieving sponsors:', err.message);
        res.status(500).send('Error retrieving sponsors');
      }else{
        res.status(200).send(rows);
      }
    });
  })


app.get('/footer',(req,res)=>{
  db.all('SELECT * FROM footer', (err, rows) => {
    if(err){
      console.error('Error retrieving footer:', err.message);
      res.status(500).send('Error retrieving footer');
    }else{
      res.status(200).send(rows);
    }
  });
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

