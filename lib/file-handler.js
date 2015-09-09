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
var liveSnapshot     = config.liveSnapshot;
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
 * Get stats from latest live snapshot.
 *
 * @return {Object}
 */
FileHandler.prototype.getLiveSnapshotStatsSync = function()
{
    var rawData, stats;

    rawData = fs.readFileSync(liveSnapshot);

    stats = JSON.parse(rawData);

    return stats;
};

/**
 * Create or update snapshot file.
 */
FileHandler.prototype.writeSnapshotFile = function()
{
    var rawStats = this.getRawStatsSync();

    this.writeFile(statSnapshot, rawStats);
};

/**
 * Create or update session stats file.
 */
FileHandler.prototype.writeSessionStatsFile = function(stats)
{
    this.writeFile(sessionStatsFile, stats);
};

/**
 * Create or update live stats file.
 */
FileHandler.prototype.writeLiveStatsFile = function(stats)
{
    this.writeFile(liveStatsFile, stats);
};

/**
 * Create or update live snapshot file.
 */
FileHandler.prototype.writeLiveSnapshotFile = function()
{
    var rawStats = this.getRawStatsSync();

    this.writeFile(liveSnapshot, rawStats);
};

/**
 * Watch for updates to tf_saveData file. Write stats to liveStats and liveSnapshot
 * files. Stats will include match by match data.
 */
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

    this.writeLiveSnapshotFile();

    fs.watchFile(tfDataFile, function (current, previous) {
        var rawStats, snapshot, matchStats, newLiveStats;

        rawStats = self.getRawStatsSync();
        snapshot = self.getLiveSnapshotStatsSync();

        if (isEqual(rawStats, snapshot)) {
            // No new session stats
            return null;
        }

        matchStats = tfStatsParser.getStatsDiff(rawStats, snapshot);

        newLiveStats = tfStatsParser.addMatchStatsToLiveStats(matchStats, liveStats);

        if (newLiveStats) {
            self.writeLiveSnapshotFile();
            self.writeLiveStatsFile(liveStats);
            liveStats = newLiveStats;
        }
    });
};

FileHandler.prototype.writeFile = function(path, data)
{
    fs.writeFile(path, JSON.stringify(data), function (err) {
        if (err) {
            throw err;
        }
    });
};

module.exports = new FileHandler();