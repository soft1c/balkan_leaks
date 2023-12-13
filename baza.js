const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Putanja do SQLite baze podataka
const dbPath = path.join(__dirname, 'baza.db');

// Kreiranje veze s bazom podataka
const db = new sqlite3.Database(dbPath);

// SQL upit za stvaranje tabele "Ljudi"
const createPeopleTable = `
  CREATE TABLE  ljudi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ime TEXT ,
    prezime TEXT ,
    datumRodjenja DATE,
    mjestoRodjenja TEXT ,
    datumSmrti DATE,
    slikaUrl TEXT
  );
`;

// SQL upit za stvaranje tabele "Fileovi"
const createFilesTable = `
  CREATE TABLE  fileovi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filePath TEXT,
    LjudiId INTEGER,
    fileType TEXT,
    FOREIGN KEY (LjudiId) REFERENCES Ljudi(id)
  );
`;

// Izvršavanje SQL upita za stvaranje tabela
db.serialize(() => {
  db.run(createPeopleTable, (err) => {
    if (err) {
      console.error('Greška prilikom stvaranja tabele "Ljudi":', err);
    } else {
      console.log('Tabela "Ljudi" je uspješno stvorena.');
    }
  });

  db.run(createFilesTable, (err) => {
    if (err) {
      console.error('Greška prilikom stvaranja tabele "Fileovi":', err);
    } else {
      console.log('Tabela "Fileovi" je uspješno stvorena.');
    }
  });
});

// Zatvaranje veze s bazom podataka nakon izvršavanja upita
db.close();