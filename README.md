## TowerFall Stats

A library for retrieving TowerFall session stats and saving them to disk and/or a database.

If you want to post stats to Slack, there's a [package](https://github.com/zpchavez/towerfall-slack) for that.

## Configuration

Towerfall-stats needs to know the location of your tf_saveData file. It assumes a default
location, but if you need to change it you can run `tf-stats-config` for a global
install or `npm run configure` for a local install. This will save the config to a file
in your home directory called `towerfall-stats-config.json`.

If you wish to save match stats to a database, you must run `tf-stats-db-config`
for a global install or `npm run db-configure` for a local install. Supported
databases are MySQL, MariaDB, PostgreSQL, and SQLite.

## Use

### Library

Towerfall-stats works by watching for changes to the tf_saveData file.
The `watchForUpdates` method will start watching for changes. It accepts a
callback which will be called after every completed match. The callback accepts
one argument, which contains the stats for the just-completed match.

```js
var fileHandler = require('towerfall-stats').fileHandler;

fileHandler.watchForUpdates(function (matchStats) {
    // Do something with matchStats
});
```

The `watchForUpdatesAndSaveToFile` method does just that, saving accumulated
stats to the `liveStats` file in your tf_saveData directory. In addition to
saving the stats of each individual match, it will also keep a tally of
total kills, deaths, and rounds, as well as kill/death and win/match ratios.
To get the contents of this file, as well as a tally of winning streaks, use the
`getCompiledLiveStats` method.

As a convenience, there is also a method that will return rankings for each category.
Just pass in the stats returned by `getCompiledLiveStats`,

```js
var statParser = require('towerfall-stats').parser;
var fileHandler = require('towerfall-stats').fileHandler;

var stats = fileHandler.getCompiledLiveStats();
var rankings = statParser.getRankings(stats);
```

This will return an object that looks like this:

```js
{
    wins   : [['blue'], ['cyan', 'white'], ['red']],
    kills  : ...
    deaths : ...
    kdr    : ...
    ...
}
```

In the example above, blue took first place, cyan and white were tied for second,
and red came in last.

### Watch script

If creating a stats file or writing stats to a database is all you need to do, you
can use the watch command (`tf-stats-watch` globally or `npm run watch` locally).
The command accepts three options (note if running via `npm run` you must have ` -- ` between the command
and the options).

* `-f` or `--save-to-file` - Save match data and accumulated summary data to a file
* `-d` or `--save-to-db`   - Save match data to the database
* `-a` or `--append`       - If using the `-f` option, append to the existing file instead of overwriting it
