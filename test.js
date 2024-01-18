const sqlite3=require('sqlite3');

const db=new sqlite3.Database('./baza.db',sqlite3.OPEN_READWRITE,(err)=>{
    if(err){
        console.error(err.message);
        throw err;
    }else{
        console.log('Connected to the SQLite database.');
        const query='SELECT * FROM footer';
        db.all(query,(err,rows)=>{
            if(err){
                console.log(err);
            }
            console.log(rows);
        });
    }
})