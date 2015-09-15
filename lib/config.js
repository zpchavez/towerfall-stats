'use strict';
var fs             = require('fs');
var configDefaults = require('./config-defaults');
var consts         = require('./consts');
var defaults       = require('lodash.defaults');

var config;

if (fs.existsSync(consts.CONFIG_PATH)) {
    config = require(consts.CONFIG_PATH);
    defaults(config, configDefaults);
} else {
    config = configDefaults;
}

config.statSnapshotFile = config.statDataDir + '/statSnapshot';
config.sessionStatsFile = config.statDataDir + '/sessionStats';
config.liveStatsFile    = config.statDataDir + '/liveStats';
config.liveSnapshotFile = config.statDataDir + '/liveSnapshot';

module.exports = config;