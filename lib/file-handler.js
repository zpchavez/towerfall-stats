'use strict';
var config        = require('./config');
var fs            = require('fs');
var tfStatsParser = require('./parser');
var xml2js        = require('xml2js');
var isEqual       = require('lodash.isequal');

var tfDataFile       = config.tfDataFile;
var statSnapshot     = config.statSnapshot;
var sessionStatsFile = config.sessionStats;
var xmlParser        = new xml2js.Parser({async : false});

var FileHandler = function() {
    this.replayStarted = false;
};

/**
 * Compile and return new session stats.
 *
 * @return {Object|null}
 */
FileHandler.prototype.compileSessionStats = function()
{
    var rawStats, snapshot, statsDiff;

    rawStats = this.getRawStatsSync();
    snapshot = this.getSnapshotStatsSync();

    if (isEqual(rawStats, snapshot)) {
        // No new session stats
        return null;
    }

    statsDiff = tfStatsParser.getStatsDiff(rawStats, snapshot);

    this.writeSessionStatsFile(statsDiff);

    return statsDiff;
};

/**
 * Return the most recently compiled session stats.
 *
 * @return {Object|null}
 */
FileHandler.prototype.getAlreadyCompiledSessionStats = function()
{
    if (fs.existsSync(sessionStatsFile)) {
        return JSON.parse(fs.readFileSync(sessionStatsFile));
    }

    return null;
};

/**
 * Get stats from tf_saveData.
 *
 * @return {Object}
 */
FileHandler.prototype.getRawStatsSync = function()
{
    var rawData, stats;

    rawData = fs.readFileSync(tfDataFile);

    xmlParser.parseString(rawData, function(err, result) {
        if (err) {
            throw err;
        }
        stats = tfStatsParser.compileFromRawData(result);
    });

    return stats;
};

/**
 * Get stats from latest snapshot.
 *
 * @return {Object}
 */
FileHandler.prototype.getSnapshotStatsSync = function()
{
    var rawData, stats;

    rawData = fs.readFileSync(statSnapshot);

    stats = JSON.parse(rawData);

    return stats;
};

/**
 * Create or update snapshot file.
 */
FileHandler.prototype.writeSnapshotFile = function(rawStats)
{
    rawStats = rawStats || this.getRawStatsSync();

    fs.writeFile(statSnapshot, JSON.stringify(rawStats), function (err) {
        if (err) {
            throw err;
        }
    });
};

/**
 * Create or update session stats file.
 */
FileHandler.prototype.writeSessionStatsFile = function(stats)
{
    fs.writeFile(sessionStatsFile, JSON.stringify(stats), function (err) {
        if (err) {
            throw err;
        }
    });
};

module.exports = new FileHandler();