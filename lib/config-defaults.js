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
        defaults.replaysDir = (
            osHomedir() + '/Library/Application Support/TowerFall/TowerFall Replays'
        );
        break;
    case 'win32':
        defaults.tfDataFile   = '/Program Files/Steam/steamapps/common/TowerFall';
        defaults.statSnapshot = osHomedir() + '/My Documents/TowerFallStats.json';
        defaults.replaysDir   = osHomedir() + '/My Documents/TowerFall Replays';
        break;
    case 'default':
        defaults.tfDataFile   = osHomedir() + '/.local/share/TowerFall/tf_saveData';
        defaults.statSnapshot = osHomedir() + '/.local/share/TowerFall/statSnapshot';
        defaults.replaysDir   = osHomedir() + '/.local/share/TowerFall/TowerFall Replays';
        break;
}

module.exports = defaults;