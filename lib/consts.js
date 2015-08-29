'use strict';
var osHomedir = require('os-homedir');
var consts;

consts = {
    CONFIG_PATH : osHomedir() + '/towerfall-stats-config.json'
};

Object.freeze(consts);

module.exports = consts;