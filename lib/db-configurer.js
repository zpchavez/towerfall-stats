#!/usr/bin/env node
'use strict';
var Configurer = require('./base-configurer');
var fs         = require('fs');
var consts     = require('../lib/consts');

var config = {};

if (fs.existsSync(consts.DB_CONFIG_PATH)) {
    config = require('../lib/db-config');
}

var schema = [
    {
        name        : 'dbType',
        description : 'Database type (pg, mysql, sqlite3)',
        required    : true,
        'default'   : config.dbType,
        conform     : function (value) {
            return ['mysql', 'pg', 'sqlite3'].indexOf(value) !== -1;
        }
    },
    {
        name        : 'dbUsername',
        description : 'Username',
        required    : false,
        'default'   : config.dbUsername
    },
    {
        name        : 'dbPassword',
        description : 'Password',
        required    : false,
        'default'   : config.dbPassword
    },
    {
        name        : 'dbHost',
        description : 'DB Host',
        required    : false,
        'default'   : config.dbHost
    },
    {
        name        : 'dbDatabase',
        description : 'Database name',
        required    : false,
        'default'   : config.dbDatabase
    },
    {
        name        : 'dbFile',
        description : 'SQLite file path',
        required    : false,
        'default'   : config.dbFile
    }
];

var configurer = new Configurer(schema, consts.DB_CONFIG_PATH);

module.exports = configurer;
