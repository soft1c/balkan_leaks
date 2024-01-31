const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        let query='INSERT INTO footer (urlPath,tekst) VALUES ("uploads/media/images/logo2.png-1706398342231-361408291.png","Footer")';
        db.run(query, (err) => {
            if (err) {
                console.error(err.message);
                throw err;
            } else {
                console.log('Footer inserted');
    }});
    }});