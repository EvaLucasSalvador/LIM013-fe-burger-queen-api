/* eslint-disable linebreak-style */
const mysql = require('mysql');

// const app = express();
// app.use(bodyParser.json());

const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'EVITA1415',
  database: 'burguer_queen_2',
});

conexion.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log('db is connect');
});

module.exports = conexion;
