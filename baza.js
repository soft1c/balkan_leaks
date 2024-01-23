const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        
        //add a column named nadimak into moderatori and admini
        const query=`ALTER TABLE ljudi ADD COLUMN broj_posjeta INTEGER DEFAULT 0;`;

        

        db.run(query, (err) => {
            if (err) {
                console.error(err.message);
            }else{
                console.log("dpbrp je");
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