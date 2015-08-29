#!/usr/bin/env node
'use strict';
var fs        = require('fs');
var defaults  = require('./config-defaults');
var cliPrompt = require('prompt');
var consts    = require('../lib/consts');

var config = {};

if (fs.existsSync(consts.CONFIG_PATH)) {
    config = require('../lib/config');
}

var Configurer = function() {
    this.additionalSchema = [];
};

Configurer.prototype.setAdditionalSchema = function(schema) {
    this.additionalSchema = schema;
};

Configurer.prototype.prompt = function()
{
    var schema = [
        {
            name        : 'tfDataFile',
            description : 'Path to tf_saveData',
            required    : true,
            'default'   : config.tfDataFile || defaults.tfDataFile
        },
        {
            name        : 'statSnapshot',
            description : (
                'Path of file in which to store stat snapshots'
            ),
            required    : true,
            'default'   : config.statSnapshot || defaults.statSnapshot
        },
        {
            name        : 'sessionStats',
            description : (
                'Path of file in which to store the most recent session stats'
            ),
            required    : true,
            'default'   : config.sessionStats || defaults.sessionStats
        },
        {
            name        : 'replaysDir',
            description : 'Directory where replays are stored',
            required    : true,
            'default'   : config.replaysDir || defaults.replaysDir
        }
    ];

    schema = schema.concat(this.additionalSchema);

    cliPrompt.start();

    cliPrompt.get(schema, function(error, results) {
        if (error) {
            console.log(error.message);
        } else {
            fs.writeFileSync(
                consts.CONFIG_PATH,
                JSON.stringify(results),
                {
                    mode : parseInt('0600', 8)
                }
            );
            console.log('Configuration Saved');
        }
    });
};

module.exports = new Configurer();