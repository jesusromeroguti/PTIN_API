//Load mariadb module
const mariadb = require('mariadb/callback');

//Set database connection credentials
const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prova_api',
};

function getConnection() {
  return mariadb.createConnection(config);
}


//Export the configuration
module.exports = getConnection;

