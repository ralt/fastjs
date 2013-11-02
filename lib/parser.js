'use strict';

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = function(fullpath) {
    return fs.readFileAsync(fullpath, { encoding: 'utf8' }).then(function(data) {
        return parse(data);
    });
};

var identifiers = {
    includes: {
        begin: /<!--\$includetemplate\$(.+)\$-->/,
        end: /<!--\$endincludetemplate\$-->/
    },
    puts: {
        begin: /<!--\$beginput\$(\w+)\$-->/,
        end: /<!--\$endput\$-->/
    }
};

function parse(data) {
    var ret;

    var includesBeginMatch = data.match(identifiers.includes.begin),
        includesEndMatch = data.match(identifiers.includes.end),
        putsBeginMatch = data.match(identifiers.puts.begin),
        putsEndMatch = data.match(identifiers.puts.end),

        includesBeginIdx = includesBeginMatch.index,
        includesEndIdx = includesEndMatch.index,
        putsBeginIdx = putsBeginMatch.index,
        putsEndIdx = putsEndMatch.index;

    return ret;
}
