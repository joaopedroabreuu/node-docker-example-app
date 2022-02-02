const express = require('express');
var mysql = require('mysql');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();

var connection = mysql.createConnection({
  host     : 'db',
  database : 'node_base',
  user     : 'root',
  password : 'secret',
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

connection.end();

app.get('/', (req, res) => {
	res.send('Olá mundo!');
});

app.listen(PORT, HOST);
