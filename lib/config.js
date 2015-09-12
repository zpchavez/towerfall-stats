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

config.statSnapshotFile = config.statDataDir + '/statSnapshot';
config.sessionStatsFile = config.statDataDir + '/sessionStats';
config.liveStatsFile    = config.statDataDir + '/liveStats';
config.liveSnapshotFile = config.statDataDir + '/liveSnapshot';

module.exports = config;