const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        
       const query = `CREATE TABLE IF NOT EXISTS sponzori(
        id INTEGER PRIMARY KEY,
        link TEXT,
        urlPath TEXT
       )
       `;

       db.run(query, (err) => {
           if (err) {
               console.error(err.message);
               throw err;
           }else{
            console.log('Table created successfully');
           }
       })

      
    }
  }
    
);

db.close((err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connection to the SQLite database closed.');
    }
});