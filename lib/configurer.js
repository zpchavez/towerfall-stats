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
            name        : 'statDataDir',
            description : 'Where snapshot, session, and live stats files will be stored',
            required    : true,
            'default'   : config.statDataDir || defaults.statDataDir
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