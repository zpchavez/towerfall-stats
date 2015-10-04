#!/usr/bin/env node
'use strict';
var fileHandler = require('../lib/file-handler');
var argv = require('minimist')(process.argv.slice(2));
var DB   = require('../lib/db');

var append     = argv.a || argv.append;
var saveToDb   = argv.d || argv['save-to-db'];
var saveToFile = argv.f || argv['save-to-file'] || (!saveToDb);

var callback = function() {/* no op */};

if (saveToDb) {
    var db = new DB();
    callback = function(matchStats) {
        db.saveMatch(matchStats);
    };
}

console.log('Watching for stat updates');
if (saveToFile) {
    fileHandler.watchForUpdatesAndSaveToFile(append, callback);
} else {
    fileHandler.watchForUpdates(callback);
}
