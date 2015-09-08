'use strict';
var config        = require('./config');
var fs            = require('fs');
var tfStatsParser = require('./parser');
var xml2js        = require('xml2js');
var isEqual       = require('lodash.isequal');

var tfDataFile       = config.tfDataFile;
var statSnapshot     = config.statSnapshot;
var sessionStatsFile = config.sessionStats;
var liveStatsFile    = config.liveStats;
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
FileHandler.prototype.writeSnapshotFile = function()
{
    var rawStats = this.getRawStatsSync();

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

FileHandler.prototype.writeLiveStatsFile = function(stats)
{
    fs.writeFile(liveStatsFile, JSON.stringify(stats), function (err) {
        if (err) {
            throw err;
        }
    });
};

FileHandler.prototype.watchForUpdates = function(append)
{
    var self = this, liveStats = {};

    append = (typeof append !== 'undefined') ? append : false;

    if (fs.existsSync(liveStatsFile)) {
        if (append) {
            liveStats = JSON.parse(fs.readFileSync(liveStatsFile));
        } else {
            fs.unlinkSync(liveStatsFile);
        }
    }

    fs.watchFile(tfDataFile, function (current, previous) {
        var rawStats, snapshot, matchStats;

        rawStats = self.getRawStatsSync();
        snapshot = self.getSnapshotStatsSync();

        if (isEqual(rawStats, snapshot)) {
            // No new session stats
            return null;
        }

        matchStats = tfStatsParser.getStatsDiff(rawStats, snapshot);

        if (tfStatsParser.addMatchStatsToLiveStats(matchStats, liveStats)) {
            self.writeSnapshotFile();
            self.writeLiveStatsFile(liveStats);
        }
    });
};

module.exports = new FileHandler();