const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        
        //add a column named nadimak into moderatori and admini
        const query=`ALTER TABLE moderatori ADD COLUMN nadimak TEXT`;

        

        db.run(query, (err) => {
            if (err) {
                console.error(err.message);
            }else{
                console.log("dpbrp je");
            }
        })
        const query2=`ALTER TABLE admini ADD COLUMN nadimak TEXT`;

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