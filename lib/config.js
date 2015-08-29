'use strict';
var fs       = require('fs');
var defaults = require('./config-defaults');
var consts   = require('./consts');

var config;

if (fs.existsSync(consts.CONFIG_PATH)) {
    config = require(consts.CONFIG_PATH);
} else {
    config = defaults;
}

module.exports = config;