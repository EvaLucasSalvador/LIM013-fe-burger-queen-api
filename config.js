const { join } = require('path')

require('dotenv').config({
    path: join(__dirname, './secrets.env')
})

exports.port = process.argv[2] || process.env.PORT || 8080;
// exports.dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/test';
exports.secret = process.env.JWT_SECRET;
exports.adminEmail = process.env.ADMIN_EMAIL;
exports.adminPassword = process.env.ADMIN_PASSWORD;

exports.dbHost = process.env.DB_HOST
exports.dbUser = process.env.DB_USER_DB
exports.dbPass = process.env.DB_PASS
exports.dbName = process.env.DB_NAME