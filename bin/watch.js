#!/usr/bin/env node
'use strict';
var fileHandler = require('../lib/file-handler');
var argv  = require('minimist')(process.argv.slice(2));
var fetch = require('node-fetch');
var config = require('../lib/config');

var append     = argv.a || argv.append;
var saveToDb   = argv.d || argv['save-to-db'];
var saveToFile = argv.f || argv['save-to-file'];
var saveToApi  = argv.t || argv['save-to-api'] || (!saveToDb && !saveToFile);;

var callback = function() {/* no op */};

if (saveToDb) {
    var DB = require('../lib/db');
    var db = new DB();
    callback = function(matchStats) {
        db.saveMatch(matchStats);
    };
}
if (saveToApi) {
    callback = function(matchStats) {
        delete matchStats.timestamp;
        delete matchStats.kdr;
        matchStats.api_token = config.apiKey;
        fetch(
            'http://api.towerfall-tracker.vm/matches',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(matchStats)
            }
        ).then(response => {
            if (response.status >= 400) {
                response.json().then(json => {
                    console.log(json);
                });
            }
        }).catch(err => {
            console.log(err);
        });
    }
}

console.log('Watching for stat updates');
if (saveToFile) {
    fileHandler.watchForUpdatesAndSaveToFile(append, callback);
} else {
    fileHandler.watchForUpdates(callback);
}
