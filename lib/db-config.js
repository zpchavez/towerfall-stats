'use strict';
var fs     = require('fs');
var consts = require('./consts');

var config = {};

if (fs.existsSync(consts.DB_CONFIG_PATH)) {
    config = require(consts.DB_CONFIG_PATH);
}

module.exports = config;
