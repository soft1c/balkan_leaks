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
        
          // Kopiranje podataka iz stare tabele u novu (bez nepoželjnih kolona)
          
        
          // Preimenovanje nove tabele u originalno ime
          

      
    }
    
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connection to the SQLite database closed.');
    }
});