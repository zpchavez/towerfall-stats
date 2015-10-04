#!/usr/bin/env node
'use strict';
var fs        = require('fs');
var cliPrompt = require('prompt');
var consts    = require('../lib/consts');

var config = {};

if (fs.existsSync(consts.CONFIG_PATH)) {
    config = require('../lib/config');
}

var Configurer = function(schema, file) {
    this.schema = schema;
    this.file   = file;
};

Configurer.prototype.setAdditionalSchema = function(additionalSchema)
{
    this.schema = this.schema.concat(additionalSchema);
};

Configurer.prototype.prompt = function()
{
    var self = this;

    cliPrompt.start();

    cliPrompt.get(this.schema, function(error, results) {
        if (error) {
            console.log(error.message);
        } else {
            fs.writeFileSync(
                self.file,
                JSON.stringify(results),
                {
                    mode : parseInt('0600', 8)
                }
            );
            console.log('Configuration Saved');
        }
    });
};

module.exports = Configurer;
