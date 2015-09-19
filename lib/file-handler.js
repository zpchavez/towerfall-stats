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
    var stats;

    if (fs.existsSync(liveStatsFile)) {
        stats = JSON.parse(fs.readFileSync(liveStatsFile));
        return tfStatsParser.addWinningStreaksToStats(stats);
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
 * Watch for updates to tf_saveData file. When stats for a new match are available,
 * pass match stats to callback.
 *
 * @param  {Function} callback
 */
FileHandler.prototype.watchForUpdates = function(callback)
{
    var self = this;

    this.writeLiveSnapshotFile();

    fs.watchFile(tfDataFile, function (current, previous) {
        var rawStats, snapshot, matchStats;

        try {
            rawStats = self.getRawStatsSync();
            snapshot = self.getLiveSnapshotStatsSync();

            if (isEqual(rawStats, snapshot)) {
                // No new session stats
                return;
            }

            matchStats = tfStatsParser.getStatsDiff(rawStats, snapshot);

            if (tfStatsParser.isMatch(matchStats)) {
                callback(matchStats);
            }

            self.writeLiveSnapshotFile();
        } catch (e) {
            console.log(e.stack);
        }
    });
};

/**
 * Watch for updates to tf_saveData file. Write stats to liveStats and liveSnapshotFile
 * files. Stats will include match by match data.
 *
 * @param {Boolean} append  Whether to add stats to the existing liveStats file. Otherwise it
 *                          will be overwritten.
 */
FileHandler.prototype.watchForUpdatesAndSaveToFile = function(append)
{
    var newLiveStats, liveStats = {}, self = this;

    append = (typeof append !== 'undefined') ? append : false;

    if (fs.existsSync(liveStatsFile)) {
        if (append) {
            liveStats = JSON.parse(fs.readFileSync(liveStatsFile));
        } else {
            fs.unlinkSync(liveStatsFile);
        }
    }

    this.watchForUpdates(function (matchStats) {
        // If live stats file has been deleted, start a new liveStats object.
        if (! fs.existsSync(liveStatsFile)) {
            liveStats = {};
        }

        newLiveStats = tfStatsParser.addMatchStatsToLiveStats(matchStats, liveStats);

        if (newLiveStats) {
            self.writeLiveStatsFile(newLiveStats);
            liveStats = newLiveStats;
        }
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