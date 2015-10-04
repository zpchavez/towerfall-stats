#!/usr/bin/env node
'use strict';
var Configurer = require('./base-configurer');
var fs         = require('fs');
var defaults   = require('./config-defaults');
var consts     = require('../lib/consts');

var config = {};

if (fs.existsSync(consts.CONFIG_PATH)) {
    config = require('../lib/config');
}

var schema = [
    {
        name        : 'tfDataFile',
        description : 'Path to tf_saveData',
        required    : true,
        'default'   : config.tfDataFile || defaults.tfDataFile
    },
    {
        name        : 'statDataDir',
        description : 'Where snapshot, session, and live stats files will be stored',
        required    : true,
        'default'   : config.statDataDir || defaults.statDataDir
    }
];

var configurer = new Configurer(schema, consts.CONFIG_PATH);

module.exports = configurer;
