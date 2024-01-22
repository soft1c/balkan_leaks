const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        

        const query=`CREATE TABLE IF NOT EXISTS aboutus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tekst TEXT
        )`;

        db.run(query, (err) => {
            if (err) {
                console.error(err.message);
            }else{
                console.log("dpbrp je");
            }
        })
        const query2=`INSERT INTO aboutus (tekst) VALUES ('')`;

        db.run(query2, (err) => {
            if (err) {
                console.error(err.message);
            }else{
                console.log("ok");
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