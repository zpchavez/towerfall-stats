'use strict';
var colors = require('./colors');
var config = require('./db-config');
var knex   = require('knex');

var DB = function() {
    var requirementsMet = (
        (config.dbType === 'sqlite3' && config.dbFile) ||
        (
            config.dbHost &&
            config.dbUsername &&
            config.dbPassword &&
            config.dbDatabase
        )
    );

    if (! requirementsMet) {
        throw new Error('DB not configured. Run db-config command.');
    }

    var connection;

    if (config.dbType === 'sqlite3') {
        connection = {
            filename : config.dbFile
        };
    } else {
        connection = {
            host     : config.dbHost,
            user     : config.dbUsername,
            password : config.dbPassword,
            database : config.dbDatabase
        };
    }

    this.knex = knex({
        client     : config.dbType,
        connection : connection
    });

    var self = this;

    this.knex.schema.hasTable('matches')
        .then(function(exists) {
            if (exists) {
                return;
            }

            return self.knex.schema.createTable('matches', function (table) {
                table.increments('id').primary();
                table.timestamp('timestamp');
                table.integer('rounds');
            });
        })
        .then(function() {
            self.knex.schema.hasTable('player_match_stats').then(function(exists) {
                if (exists) {
                    return;
                }

                return self.knex.schema.createTable('player_match_stats', function(table) {
                    table.increments('id').primary();
                    table.integer('match_id').references('id').inTable('matches');
                    table.enu('color', colors).index();
                    table.integer('kills');
                    table.integer('deaths');
                    table['boolean']('won');
                });
            });
        });
};

DB.prototype.saveMatch = function(matchStats) {

};

module.exports = DB;
