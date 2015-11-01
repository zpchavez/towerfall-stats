'use strict';
var config = require('./db-config');
var knex   = require('knex');

var requirementsMet = (
    (config.dbType === 'sqlite3' && config.dbFile) ||
    (
        config.dbHost &&
        config.dbUsername &&
        config.dbPassword &&
        config.dbDatabase
    )
);

if (! requirementsMet) {
    throw new Error('DB not configured. Run db-config command.');
}

var connection;

if (config.dbType === 'sqlite3') {
    connection = {
        filename : config.dbFile
    };
} else {
    connection = {
        host     : config.dbHost,
        user     : config.dbUsername,
        password : config.dbPassword,
        database : config.dbDatabase
    };
}

module.exports = knex({
    client     : config.dbType,
    connection : connection
});
