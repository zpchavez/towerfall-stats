'use strict';
var osHomedir = require('os-homedir');
var consts;

consts = {
    CONFIG_PATH    : osHomedir() + '/towerfall-stats-config.json',
    DB_CONFIG_PATH : osHomedir() + '/towerfall-stats-db-config.json'
};

Object.freeze(consts);

module.exports = consts;