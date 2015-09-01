'use strict';
var colors = require('./colors');
var sortBy = require('lodash.sortby');

var StatsParser = function() {};

/**
 * Convert the parsed XML from tf_saveData to an object.
 * Only keep data we're interested in.
 *
 * @param  {Object} data As parsed by xml2js
 * @return {Object}
 */
StatsParser.prototype.compileFromRawData = function(data) {
    var stats = {
        wins   : {},
        kills  : {},
        deaths : {},
        kdr    : {}
    };

    stats.matches = data.SaveData.Stats[0].MatchesPlayed[0];
    stats.rounds  = data.SaveData.Stats[0].RoundsPlayed[0];

    colors.forEach(function (color, index) {
        var keyName, kills, deaths, wins;

        keyName = color.charAt(0).toUpperCase() + color.substr(1);

        wins   = data.SaveData.Stats[0].Wins[0].unsignedLong;
        kills  = data.SaveData.Stats[0].Kills[0];
        deaths = data.SaveData.Stats[0].Deaths[0];

        stats.wins[color]   = wins[index];
        stats.kills[color]  = kills[keyName][0];
        stats.deaths[color] = deaths[keyName][0];
        stats.kdr[color]    = (kills[keyName][0] / Math.max(deaths[keyName][0], 1)).toFixed(2);
    });

    return stats;
};

/**
 * Get the session stats by subtracting current stats from the latest snapshot.
 * Stats must be in the format returned by compileFromRawData.
 *
 * @param  {Object} currentStats
 * @param  {Object} snapshotStats
 * @return {Object}
 */
StatsParser.prototype.getStatsDiff = function(currentStats, snapshotStats) {
    var diff = {wins : {}, kills: {}, deaths: {}, kdr: {}};

    diff.timestamp = Math.floor(Date.now() / 1000);
    diff.matches   = currentStats.matches - snapshotStats.matches;
    diff.rounds    = currentStats.rounds - snapshotStats.rounds;

    colors.forEach(function (color) {
        var wins   = currentStats.wins[color] - snapshotStats.wins[color];
        var kills  = currentStats.kills[color] - snapshotStats.kills[color];
        var deaths = currentStats.deaths[color] - snapshotStats.deaths[color];
        var kdr    = (kills / Math.max(deaths, 1)).toFixed(2);

        // Skip archers with no activity.
        if (wins === 0 && kills === 0 && deaths === 0) {
            return;
        }

        diff.wins[color]   = wins;
        diff.kills[color]  = kills;
        diff.deaths[color] = deaths;
        diff.kdr[color]    = kdr;
    });

    return diff;
};

/**
 * Get an object containing player rankings for each stat. Index 0 is first place, etc.
 *
 * @param  {Object} statsDiff Value returned by getStatsDiff
 * @return {Object}
 */
StatsParser.prototype.getRankings = function(statsDiff) {
    var rankCalc = {wins: {}, kills: {}, deaths: {}, kdr: {}};

    colors.forEach(function (color) {
        var wins   = statsDiff.wins[color];
        var kills  = statsDiff.kills[color];
        var deaths = statsDiff.deaths[color];
        var kdr    = statsDiff.kdr[color];

        rankCalc.wins[wins] = rankCalc.wins[wins] ? rankCalc.wins[wins].concat(color) : [color];
        rankCalc.kills[kills] = rankCalc.kills[kills] ? rankCalc.kills[kills].concat(color) : [color];
        rankCalc.deaths[deaths] = rankCalc.deaths[deaths] ? rankCalc.deaths[deaths].concat(color) : [color];
        rankCalc.kdr[kdr] = rankCalc.kdr[kdr] ? rankCalc.kdr[kdr].concat(color) : [color];
    });

    return {
        wins   : sortBy(rankCalc.wins, function(v, k) {return k * -1;}),
        kills  : sortBy(rankCalc.kills, function(v, k) {return k * -1;}),
        deaths : sortBy(rankCalc.deaths, function(v, k) {return k * -1;}),
        kdr    : sortBy(rankCalc.kdr, function(v, k) {return k * -1;})
    };
};

StatsParser.prototype.addMatchStatsToSessionStats = function(matchStats, sessionStats)
{
    var match = {};

    // Find the match winner
    Object.keys(matchStats.wins).forEach(function (color) {
        if (matchStats.wins[color] > 0) {
            match.winner = color;
        }
    });

    // Discard incomplete match
    if (! match.winner) {
        return sessionStats;
    }

    // Increment wins (even if by zero)
    Object.keys(matchStats.wins).forEach(function (color) {
        sessionStats.wins        = sessionStats.wins || {};
        sessionStats.wins[color] = (sessionStats.wins[color] || 0) + matchStats.wins[color];
    });

    // Add up kills and deaths and create the match details object
    sessionStats.matchDetails = sessionStats.matchDetails || [];
    ['kills', 'deaths'].forEach(function (category) {
        match[category] = {};
        sessionStats[category] = sessionStats[category] || {};
        Object.keys(matchStats[category]).forEach(function (color) {
            if (typeof matchStats[category][color] !== 'undefined') {
                var sessionScore = sessionStats[category][color] || 0;

                match[category][color]        = matchStats[category][color];
                sessionStats[category][color] = sessionScore + match[category][color];
            }
        });
    });
    match.rounds = matchStats.rounds;
    sessionStats.matchDetails.push(match);

    // Add to total matches and rounds
    sessionStats.matches = (sessionStats.matches || 0) + matchStats.matches;
    sessionStats.rounds  = (sessionStats.rounds || 0) + matchStats.rounds;

    sessionStats.timestamp = Math.floor(Date.now() / 1000);

    return sessionStats;
};

module.exports = new StatsParser();