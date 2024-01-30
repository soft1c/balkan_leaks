const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        let query=`CREATE TABLE IF NOT EXISTS shop (
            id INTEGER PRIAMRY KEY,
            naziv TEXT,
            cijena REAL,
            slika TEXT
            opis TEXT
        )`;

        db.run(query, (err)=>{
            if(err){
                console.log(err);
            }else{
                console.log('ok');
            }
        });
        
        let query2= `CREATE TABLE   IF NOT EXISTS donate(
            id INTEGER PRIMARY KEY,
            link TEXT,
            qr TEXT
        )`;
        
        db.run(query2, (req,res)=>{
            if(err){
                console.log(err);
            }else{
                console.log('ok');
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