const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        // Kreiranje tabele featuredPersons
        db.run(`CREATE TABLE IF NOT EXISTS featuredPersons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            person1_id INTEGER NOT NULL,
            person2_id INTEGER NOT NULL,
            person3_id INTEGER NOT NULL,
            person4_id INTEGER NOT NULL,
            FOREIGN KEY (person1_id) REFERENCES ljudi(id),
            FOREIGN KEY (person2_id) REFERENCES ljudi(id),
            FOREIGN KEY (person3_id) REFERENCES ljudi(id),
            FOREIGN KEY (person4_id) REFERENCES ljudi(id)
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("Tabela 'featuredPersons' uspješno kreirana.");
            }
        });

        // Kreiranje tabele osobaMjeseca
        db.run(`CREATE TABLE IF NOT EXISTS osobaMjeseca (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            osobaId INTEGER NOT NULL,
            FOREIGN KEY (osobaId) REFERENCES ljudi(id)
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("Tabela 'osobaMjeseca' uspješno kreirana.");
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS moderatori (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            password TEXT   
        )`, (err)=>{
            if(err){
            console.error(err.message);
        }else{
            console.log('Kreirano ');

        }
    });
    }
});

// Zatvorite bazu podataka
db.close((err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connection to the SQLite database closed.');
    }
});