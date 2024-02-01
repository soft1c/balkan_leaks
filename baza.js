const sqlite3 = require('sqlite3').verbose();

// Otvorite bazu podataka (ili je kreirajte ako ne postoji)
let db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {

        //alter table sponzori add column text Text
        //kreiraj tabelu sponzor_opis koja ima samo jedan red i jednu kolonu, koja se zove opis 
        let query7="CREATE TABLE IF NOT EXISTS sponzor_opis (id INTEGER PRIMARY KEY, opis TEXT)";
        db.run(query7,(err)=>{
            if(err){
                console.log(err);
            }else{
                console.log('ok je ovo');
            }
        });
        let query8="CREATE TABLE IF NOT EXISTS shop_opis (id INTEGER PRIMARY KEY, opis TEXT)";
        db.run(query8,(err)=>{
            if(err){
                console.log(err);
            }else{
                console.log('ok je i ovo');
            }
        });

        db.run("DELETE FROM shop_opis WHERE id=2", (err) => {
            if (err) {
                console.log(err);
            }else{
                console.log('obrisano');
            }
        });
        db.run("INSERT INTO sponzor_opis (opis) VALUES ('nsiyta')", (err) => {
            if (err) {
                console.log(err);
            }else{
                console.log('gotova baza');
            }
        });


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