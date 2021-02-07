/* eslint-disable linebreak-style */
const mysql = require('mysql');

// const app = express();
// app.use(bodyParser.json());

const { dbHost, dbUser, dbPass, dbName } = require('./config')

const conexion = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: dbPass,
  database: dbName
});

conexion.connect(async (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log('db is connect');
});

module.exports = conexion;
