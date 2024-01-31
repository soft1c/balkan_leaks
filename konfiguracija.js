const mysql = require('mysql2');

const dbConfig = mysql.createPool({
    host: 'localhost',
    user: 'user',
    database: 'osobe',
    password: '12345678'
});

module.exports = dbConfig.promise();