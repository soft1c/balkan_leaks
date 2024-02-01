const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {

        //drop table dogadjaji
        let query4="DROP TABLE IF EXISTS dogadjaji";
        db.run(query4,(err)=>{
            if(err){
                console.log(err);
            }else{console.log('obrisano');
        }
        })

        //kreiraj tabelu dogadjaji koja ima naziv dogadjaja, opis, vrijeme i lokaciju
        let query="CREATE TABLE IF NOT EXISTS dogadjaji (id INTEGER PRIMARY KEY,naziv TEXT, opis TEXT, vrijeme TEXT, lokacija TEXT)";
        db.run(query,(err)=>{
            if(err){
                console.log(err);
            }else{
                console.log('ok');
            }
        })

        //kreiraj medju tabelu ljudi_dogadjaji koja ima dva foreign keya, jedan na ljude drugi na dogadjaje
        let query2="CREATE TABLE IF NOT EXISTS ljudi_dogadjaji (id INTEGER PRIMARY KEY, id_ljudi INTEGER, id_dogadjaja INTEGER)";
        db.run(query2,(err)=>{
            if(err){
                console.log(err);
            }else{
                console.log('ok opet');
            }
        })

        //napravi mi tabelu fileovi_dogadjaji koji ima foreign key na dogadjaje za koji se vezu, tip fajla (slika,video,tekst ili audio) i naziv fajla
        let query3="CREATE TABLE IF NOT EXISTS fileovi_dogadjaji (id INTEGER PRIMARY KEY, id_dogadjaja INTEGER, tip TEXT, naziv TEXT)";
        db.run(query3,(err)=>{
            if(err){
                console.log(err);
            }else{
                console.log('dobro 3');
            }
        })
    }});