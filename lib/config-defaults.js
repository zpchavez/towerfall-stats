/* globals process */
'use strict';
var osHomedir = require('os-homedir');

var defaults = {};

switch (process.platform) {
    case 'darwin':
        defaults.tfDataFile = (
            osHomedir() + '/Library/Application Support/TowerFall/tf_saveData'
        );
        defaults.statDataDir = (
            osHomedir() + '/Library/Application Support/TowerFall'
        );
        break;
    case 'win32':
        defaults.tfDataFile  = '/Program Files/Steam/steamapps/common/TowerFall/tf_saveData';
        defaults.statDataDir = osHomedir() + '/My Documents/TowerFall Stats';
        break;
    case 'default':
        defaults.tfDataFile  = osHomedir() + '/.local/share/TowerFall/tf_saveData';
        defaults.statDataDir = osHomedir() + '/.local/share/TowerFall';
        break;
}

module.exports = defaults;