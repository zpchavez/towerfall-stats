'use strict';
var config        = require('./config');
var fs            = require('fs');
var tfStatsParser = require('./parser');
var xml2js        = require('xml2js');
var isEqual       = require('lodash.isequal');

var tfDataFile       = config.tfDataFile;
var liveStatsFile    = config.liveStatsFile;
var liveSnapshotFile = config.liveSnapshotFile;
var xmlParser        = new xml2js.Parser({async : false});

var FileHandler = function() {
    this.replayStarted = false;
};

FileHandler.prototype.getCompiledLiveStats = function()
{
    if (fs.existsSync(liveStatsFile)) {
        return JSON.parse(fs.readFileSync(liveStatsFile));
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
 * Get stats from latest live snapshot.
 *
 * @return {Object}
 */
FileHandler.prototype.getLiveSnapshotStatsSync = function()
{
    var rawData, stats;

    rawData = fs.readFileSync(liveSnapshotFile);

    stats = JSON.parse(rawData);

    return stats;
};

/**
 * Create or update live stats file.
 */
FileHandler.prototype.writeLiveStatsFile = function(stats)
{
    this._writeFile(liveStatsFile, stats);
};

/**
 * Create or update live snapshot file.
 */
FileHandler.prototype.writeLiveSnapshotFile = function()
{
    var rawStats = this.getRawStatsSync();

    this._writeFile(liveSnapshotFile, rawStats);
};

/**
 * Watch for updates to tf_saveData file. Write stats to liveStats and liveSnapshotFile
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
            self.writeLiveStatsFile(newLiveStats);
            liveStats = newLiveStats;
        }

        self.writeLiveSnapshotFile();
    });
};

FileHandler.prototype._writeFile = function(path, data)
{
    fs.writeFile(path, JSON.stringify(data), function (err) {
        if (err) {
            throw err;
        }
    });
};

module.exports = new FileHandler();