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
 * @param  {Object} stats
 * @return {Object}
 */
StatsParser.prototype.getRankings = function(stats) {
    var rankCalc = {wins: {}, kills: {}, deaths: {}, kdr: {}, matches : {}, winRate : {}, streaks : {}};

    if (! stats.winningStreaks) {
        this.addWinningStreaksToStats(stats);
    }

    Object.keys(stats.wins).forEach(function (color) {
        var wins    = stats.wins[color];
        var kills   = stats.kills[color];
        var deaths  = stats.deaths[color];
        var kdr     = stats.kdr[color];
        var matches = stats.matchCount[color];
        var winRate = stats.winRate[color];
        var streaks = stats.winningStreaks[color];

        rankCalc.wins[wins] = rankCalc.wins[wins] ? rankCalc.wins[wins].concat(color) : [color];
        rankCalc.kills[kills] = rankCalc.kills[kills] ? rankCalc.kills[kills].concat(color) : [color];
        rankCalc.deaths[deaths] = rankCalc.deaths[deaths] ? rankCalc.deaths[deaths].concat(color) : [color];
        rankCalc.kdr[kdr] = rankCalc.kdr[kdr] ? rankCalc.kdr[kdr].concat(color) : [color];
        rankCalc.matches[matches] = rankCalc.matches[matches] ? rankCalc.matches[matches].concat(color) : [color];
        rankCalc.winRate[winRate] = rankCalc.winRate[winRate] ? rankCalc.winRate[winRate].concat(color) : [color];
        rankCalc.streaks[streaks] = rankCalc.streaks[streaks] ? rankCalc.streaks[streaks].concat(color) : [color];
    });

    return {
        wins    : sortBy(rankCalc.wins, function(v, k) {return k * -1;}),
        kills   : sortBy(rankCalc.kills, function(v, k) {return k * -1;}),
        deaths  : sortBy(rankCalc.deaths, function(v, k) {return k * -1;}),
        kdr     : sortBy(rankCalc.kdr, function(v, k) {return k * -1;}),
        matches : sortBy(rankCalc.matches, function(v, k) {return k * -1;}),
        winRate : sortBy(rankCalc.winRate, function(v, k) {return k * -1;}),
        streaks : sortBy(rankCalc.streaks, function(v, k) {return k * -1;})
    };
};

/**
 * Add each color's longest winning streak to stats.
 *
 * @param  {Object} stats
 * @return {Object}
 */
StatsParser.prototype.addWinningStreaksToStats = function(stats) {
    var streaks = {}, previousWinners = [], participatingColors = {};

    stats.matchDetails.forEach(function (match) {
        var winners = [];
        Object.keys(match.wins).forEach(function (color) {
            if (match.wins[color]) {
                if (! streaks[color]) {
                    streaks[color] = [];
                }

                if (previousWinners.indexOf(color) === -1) {
                    streaks[color].push(1);
                } else {
                    streaks[color][streaks[color].length - 1] += 1;
                }

                winners.push(color);
            }
            participatingColors[color] = true;
        });
        previousWinners = winners.slice();
    });

    stats.winningStreaks = {};
    Object.keys(participatingColors).forEach(function (color) {
        stats.winningStreaks[color] = streaks[color] ? Math.max.apply(null, streaks[color]) : 0;
    });

    return stats;
};

StatsParser.prototype.addMatchStatsToLiveStats = function(matchStats, liveStats)
{
    var match = {};

    if (! this.isMatch(matchStats)) {
        return null;
    }

    liveStats.matchCount = liveStats.matchCount || {};
    liveStats.winRate    = liveStats.winRate || {};
    liveStats.kdr        = liveStats.kdr || {};

    // Add up kills and deaths and create the match details object
    liveStats.matchDetails = liveStats.matchDetails || [];
    ['wins', 'kills', 'deaths'].forEach(function (category) {
        match[category] = {};
        liveStats[category] = liveStats[category] || {};
        Object.keys(matchStats[category]).forEach(function (color) {
            if (typeof matchStats[category][color] !== 'undefined') {
                var sessionScore              = liveStats[category][color] || 0;
                match[category][color]        = matchStats[category][color];
                liveStats[category][color] = sessionScore + match[category][color];
            }
        });
    });

    Object.keys(match.wins).forEach(function (color) {
        // Count matches each color participated in
        if (typeof match.wins[color] !== 'undefined') {
            liveStats.matchCount[color] = (liveStats.matchCount[color] || 0) + 1;
        }
    });

    // Calculate win and K/D rates
    Object.keys(liveStats.matchCount).forEach(function (color) {
        liveStats.winRate[color] = (liveStats.wins[color] / liveStats.matchCount[color]).toFixed(2);
        liveStats.kdr[color] = (liveStats.kills[color] / Math.max(liveStats.deaths[color], 1)).toFixed(2);
    });

    match.rounds = matchStats.rounds;

    liveStats.matchDetails.push(match);

    liveStats.matches   = (liveStats.matches || 0) + 1;
    liveStats.rounds    = (liveStats.rounds || 0) + matchStats.rounds;
    liveStats.timestamp = Math.floor(Date.now() / 1000);

    return liveStats;
};

/**
 * Determine if stat diff contains data for a single match.
 *
 * @param  {Object}  stats Output of getStatsDiff
 * @return {Boolean}
 */
StatsParser.prototype.isMatch = function (stats) {
    var wins = [];

    if (! stats.wins) {
        return false;
    }

    Object.keys(stats.wins).forEach(function (color) {
        wins.push(stats.wins[color]);
    });

    return Math.max.apply(null, wins) === 1;
};

module.exports = new StatsParser();