## TowerFall Stats

A library for retrieving TowerFall session stats.

If you want to post stats to Slack, there's a [package](https://github.com/zpchavez/towerfall-slack) for that.

## Configuration

Towerfall-stats needs to know the location of your tf_saveData file. It assumes a default
location, but if you need to change it you can run `tf-stats-config` for a global
install or `npm run configure` for a local install. This will save the config to a file
in your home directory called `towerfall-stats-config.json`. The config will also give
you the option to set the location of files that the library itself creates.

## Use

Towerfall-stats works by creating a snapshot of stats taken from the tf_saveData file,
and then comparing it with the tf_saveData file again after you've played a session.
In order to get session stats, you must first create the snapshot file.

```js
var fileHandler = require('towerfall-stats').fileHandler;

fileHandler.writeSnapshotFile();
```

Once you have a snapshot file to compare against, you can get session stats like so:

```js
var stats = fileHandler.compileSessionStats();
```

Once you have your session stats, you'll probably want to create an updated snapshot file,
otherwise the next time you call compileSessionStats those same stats will still be
counted. To do this just call `writeSnapshotFile` again. If there has been no new activity
since the last snapshot, `compileSessionStats` will return null.

Whenever you call `compileSessionStats`, the stats are saved to a file.
If you need those stats again after you have updated the snapshot, you can retrieve
them by calling:

```js
stats = fileHandler.getAlreadyCompiledSessionStats();
```

The stats are returned as an object that looks like this:

```js
{
    wins: {
        green  : 5,
        blue   : 5,
        pink   : 5,
        orange : 0,
        white  : 0,
        yellow : 0,
        cyan   : 0,
        purple : 0,
        red    : 0
    },
    kills: {
        ...
    },
    deaths: {
        ...
    },
    kdr: {
        ...
    },
    timestamp : 1440872166,
    matches   : 15,
    rounds    : 120
}
```

As a convenience, there is also a method that will return rankings for each category.

```js
var statParser = require('towerfall-stats').parser;

var rankings = statParser.getRankings(stats);
```

This will return an object that looks like this:

```js
{
    wins   : [ [ 'blue' ], [ 'cyan', 'white' ], ['red'] ],
    kills  : ...
    deaths : ...
    kdr    : ...
}
```

In the example above, blue took first place, cyan and white were tied for second,
and red came in last.
