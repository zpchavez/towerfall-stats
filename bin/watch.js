#!/usr/bin/env node
'use strict';
var fileHandler = require('../lib/file-handler');

var append = ['-a', '--append'].indexOf(process.argv[2]) !== -1;

fileHandler.watchForUpdatesAndSaveToFile(append);
