const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }
    const query1='DROP TABLE IF EXISTS vijesti';
    db.run(query1, (err) => {
        if (err) {
            console.error(err.message);
            throw err;
        }else{
            console.log('dobar');
        }
    })
    const query='CREATE TABLE IF NOT EXISTS vijesti (id INTEGER PRIMARY KEY AUTOINCREMENT, naslov TEXT, tekst TEXT)';
    db.run(query, (err) => {
        if (err) {
            console.error(err.message);
            throw err;
        }else{
            console.log("fobro je");
        }
    })
});