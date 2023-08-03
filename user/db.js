var mysql = require('mysql');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    database : 'mindgamedb'
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;