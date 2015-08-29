'use strict';
var colors = require('./colors');
var sortBy = require('lodash.sortby');

var StatsParser = function() {};

StatsParser.prototype.compileFromRawData = function(data) {
    var overallStats = {
        matches : 0,
        rounds  : 0
    };

    var perPlayerStats = {
        wins   : {},
        kills  : {},
        deaths : {},
        kdr    : {}
    };

    overallStats.matches = data.SaveData.Stats[0].MatchesPlayed[0];
    overallStats.rounds  = data.SaveData.Stats[0].RoundsPlayed[0];

    colors.forEach(function (color, index) {
        var keyName, kills, deaths, wins;

        keyName = color.charAt(0).toUpperCase() + color.substr(1);

        wins   = data.SaveData.Stats[0].Wins[0].unsignedLong;
        kills  = data.SaveData.Stats[0].Kills[0];
        deaths = data.SaveData.Stats[0].Deaths[0];

        perPlayerStats.wins[color]   = wins[index];
        perPlayerStats.kills[color]  = kills[keyName][0];
        perPlayerStats.deaths[color] = deaths[keyName][0];
        perPlayerStats.kdr[color]    = kills[keyName][0] / Math.max(deaths[keyName][0], 1);
    });

    return {
        overallStats   : overallStats,
        perPlayerStats : perPlayerStats
    };
};

StatsParser.prototype.getStatsDiff = function(newStats, oldStats) {
    var diff = {wins : {}, kills: {}, deaths: {}, kdr: {}};

    diff.timestamp = Math.floor(Date.now() / 1000);
    diff.matches   = newStats.overallStats.matches - oldStats.overallStats.matches;
    diff.rounds    = newStats.overallStats.rounds - oldStats.overallStats.rounds;

    colors.forEach(function (color) {
        var wins   = newStats.perPlayerStats.wins[color] - oldStats.perPlayerStats.wins[color];
        var kills  = newStats.perPlayerStats.kills[color] - oldStats.perPlayerStats.kills[color];
        var deaths = newStats.perPlayerStats.deaths[color] - oldStats.perPlayerStats.deaths[color];
        var kdr    = (kills / Math.max(deaths, 1)).toFixed(2);

        diff.wins[color]   = wins;
        diff.kills[color]  = kills;
        diff.deaths[color] = deaths;
        diff.kdr[color]    = kdr;
    });

    return diff;
};

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

module.exports = new StatsParser();