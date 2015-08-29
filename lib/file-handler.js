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

FileHandler.prototype.createSnapshotFile = function() {
    fs.readFile(tfDataFile, function(err, data) {
        xmlParser.parseString(data, function(err, result) {
            var stats = tfStatsParser.compileFromRawData(result);
            fs.writeFile(statSnapshot, JSON.stringify(stats), function (err) {
                if (err) {
                    throw err;
                }
            });
        });
    });
};

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

FileHandler.prototype.getPreviousStatsSync = function()
{
    var rawData, stats;

    rawData = fs.readFileSync(statSnapshot);

    stats = JSON.parse(rawData);

    return stats;
};

FileHandler.prototype.compileSessionStats = function()
{
    var rawStats, snapshot, statsDiff;

    rawStats = this.getRawStatsSync();
    snapshot = this.getPreviousStatsSync();

    if (isEqual(rawStats, snapshot)) {
        // No new session stats
        return null;
    }

    statsDiff = tfStatsParser.getStatsDiff(rawStats, snapshot);

    this.updateSessionStatsFile(statsDiff);

    return statsDiff;
};

FileHandler.prototype.getAlreadyCompiledSessionStats = function()
{
    if (fs.existsSync(sessionStatsFile)) {
        return JSON.parse(fs.readFileSync(sessionStatsFile));
    }

    return null;
};

FileHandler.prototype.updateSnapshotFile = function(rawStats)
{
    rawStats = rawStats || this.getRawStatsSync();

    fs.writeFile(statSnapshot, JSON.stringify(rawStats), function (err) {
        if (err) {
            throw err;
        }
    });
};

FileHandler.prototype.updateSessionStatsFile = function(stats)
{
    fs.writeFile(sessionStatsFile, JSON.stringify(stats), function (err) {
        if (err) {
            throw err;
        }
    });
};

module.exports = new FileHandler();