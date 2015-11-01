'use strict';
var colors  = require('./colors');
var config  = require('./db-config');
var knex    = require('./db-knex');
var promise = require('bluebird');

var DB = function() {
    this._buildSchema();
};

DB.prototype.saveMatch = function(matchStats) {
    knex.transaction(function (txn) {
        knex.insert({rounds: matchStats.rounds}, 'id')
            .into('matches')
            .transacting(txn)
            .then(function (ids) {
                var matchId = ids[0];
                var participatingArchers = Object.keys(matchStats.kills);

                return promise.map(participatingArchers, function (color) {
                    return knex.insert({
                        match_id : matchId,
                        color    : color,
                        kills    : matchStats.kills[color],
                        deaths   : matchStats.deaths[color],
                        won      : matchStats.wins[color]
                    })
                    .into('player_match_stats')
                    .transacting(txn);
                });
            })
            .then(txn.commit)
            .caught(txn.rollback);
    });
};

DB.prototype._buildSchema = function()
{
    knex.schema.hasTable('matches')
        .then(function(exists) {
            if (exists) {
                return;
            }

            return knex.schema.createTable('matches', function (table) {
                table.increments('id').primary();
                if (config.dbType === 'mysql') {
                    table.timestamp('datetime');
                } else {
                    table.timestamp('datetime').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
                }

                table.integer('rounds');
            });
        })
        .then(function() {
            knex.schema.hasTable('player_match_stats').then(function(exists) {
                if (exists) {
                    return;
                }

                return knex.schema.createTable('player_match_stats', function(table) {
                    table.increments('id').primary();
                    table.integer('match_id')
                        .unsigned()
                        .notNullable()
                        .references('id')
                        .inTable('matches');
                    table.enu('color', colors).index();
                    table.integer('kills');
                    table.integer('deaths');
                    table['boolean']('won');
                });
            });
        });
};

module.exports = DB;
