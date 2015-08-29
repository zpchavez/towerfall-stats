/* globals process */
'use strict';
var osHomedir = require('os-homedir');

var defaults = {};

switch (process.platform) {
    case 'darwin':
        defaults.tfDataFile = (
            osHomedir() + '/Library/Application Support/TowerFall/tf_saveData'
        );
        defaults.statSnapshot = (
            osHomedir() + '/Library/Application Support/TowerFall/statSnapshot'
        );
        defaults.sessionStats = (
            osHomedir() + '/Library/Application Support/TowerFall/sessionStats'
        );
        break;
    case 'win32':
        defaults.tfDataFile   = '/Program Files/Steam/steamapps/common/TowerFall/tf_saveData';
        defaults.statSnapshot = osHomedir() + '/My Documents/statSnapshot';
        defaults.sessionStats = osHomedir() + '/My Documents/sessionStats';
        break;
    case 'default':
        defaults.tfDataFile   = osHomedir() + '/.local/share/TowerFall/tf_saveData';
        defaults.statSnapshot = osHomedir() + '/.local/share/TowerFall/statSnapshot';
        defaults.sessionStats = osHomedir() + '/.local/share/TowerFall/sessionStats';
        break;
}

module.exports = defaults;