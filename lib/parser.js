'use strict';

var Promise = require('bluebird'),
    Set = require('simplesets').Set,
    fs = Promise.promisifyAll(require('fs'));

module.exports = function(fullpath) {
    return fs.readFileAsync(fullpath, { encoding: 'utf8' }).then(function(data) {
        return parse(data, fullpath);
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

var modules = {};

var currentModule = [];

function parse(data, fullpath) {
    var ret;

    var includesBeginMatch = data.match(identifiers.includes.begin),
        includesEndMatch = data.match(identifiers.includes.end),
        putsBeginMatch = data.match(identifiers.puts.begin),
        putsEndMatch = data.match(identifiers.puts.end),

        includesBeginIdx = includesBeginMatch.index,
        includesEndIdx = includesEndMatch.index,
        putsBeginIdx = putsBeginMatch.index,
        putsEndIdx = putsEndMatch.index;

    if (isFirst(includesBeginIdx, includesEndIdx, putsBeginIdx, putsEndIdx)) {
        ret += data.slice(0, includesBeginIdx);
        currentModule.push({ name: includesBeginMatch[1], puts: [] });

        modules[includesBeginMatch[1]] = modules[includesBeginMatch[1]] || new Set();
        modules[includesBeginMatch[1]].add(fullpath);

        return parse(data.slice(includesBeginIdx + includesBeginMatch[0].length), fullpath);
    }

    if (isFirst(putsBeginIdx, putsEndIdx, includesBeginIdx, includesEndIdx)) {
        currentModule[currentModule.length - 1].puts.push({
            name: putsBeginMatch[1]
        });

        return parse(data.slice(putsBeginIdx + putsBeginMatch[0].length), fullpath);
    }

    if (isFirst(putsEndIdx, putsBeginIdx, includesBeginIdx, includesEndIdx)) {
        currentModule[currentModule.length - 1]
            .puts[currentModule[currentModule.length - 1].puts.length - 1]
            .value = data.slice(0, putsEndIdx);

        return parse(data.slice(putsEndIdx + putsEndMatch[0].length), fullpath);
    }

    if (isFirst(includesEndIdx, includesBeginIdx, putsBeginIdx, putsEndIdx)) {
    }

    return ret;
}

function isFirst(i, n, d, e) {
    return i < n && i < d && i < e;
}
