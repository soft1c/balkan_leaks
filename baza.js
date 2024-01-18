const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        
       
        db.run(`CREATE TABLE IF NOT EXISTS footer (
            id INTEGER PRIMARY KEY,
            urlPath TEXT,
            tekst TEXT
          )`);


          const insertQuery = `INSERT INTO footer (urlPath, tekst) VALUES (?, ?)`;

          // Sample data to insert
          const footers = [
            { slikaUrl: 'url_to_image_1.jpg', tekst: 'First footer text' },
            { slikaUrl: 'url_to_image_2.jpg', tekst: 'Second footer text' },
            { slikaUrl: 'url_to_image_3.jpg', tekst: 'Third footer text' },
            { slikaUrl: 'url_to_image_4.jpg', tekst: 'Fourth footer text' }
          ];
        
          footers.forEach(footer => {
            db.run(insertQuery, [footer.slikaUrl, footer.tekst], (err) => {
              if (err) {
                console.error(err.message);
              } else {
                console.log(`Inserted footer with image: ${footer.slikaUrl}`);
              }
            });
          });
        };

      
    }
    
);

db.close((err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connection to the SQLite database closed.');
    }
});