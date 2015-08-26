#!/usr/bin/env node
'use strict';
var fs        = require('fs');
var osHomedir = require('os-homedir');
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
    var defaults = {};

    switch (process.platform) {
        case 'darwin':
            defaults.tfDataFile = (
                osHomedir() + '/Library/Application Support/TowerFall/tf_saveData'
            );
            defaults.statSnapshot = (
                osHomedir() + '/Library/Application Support/TowerFall/statSnapshot'
            );
            defaults.replaysDir = (
                osHomedir() + '/Library/Application Support/TowerFall/TowerFall Replays'
            );
            break;
        case 'win32':
            defaults.tfDataFile     = '/Program Files/Steam/steamapps/common/TowerFall';
            defaults.statSnapshot = osHomedir() + '/My Documents/TowerFallStats.json';
            defaults.replaysDir   = osHomedir() + '/My Documents/TowerFall Replays';
            break;
        case 'default':
            defaults.tfDataFile     = osHomedir() + '/.local/share/TowerFall/tf_saveData';
            defaults.statSnapshot = osHomedir() + '/.local/share/TowerFall/statSnapshot';
            defaults.replaysDir   = osHomedir() + '/.local/share/TowerFall/TowerFall Replays';
            break;
    }

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