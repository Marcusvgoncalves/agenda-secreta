const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

module.exports = open({
  filename: './agenda.db',
  driver: sqlite3.Database
});