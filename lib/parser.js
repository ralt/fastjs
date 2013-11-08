'use strict';

var Promise = require('bluebird'),
    Set = require('simplesets').Set,
    path = require('path'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = function(fullpath, basepath) {
    return fs.readFileAsync(fullpath, { encoding: 'utf8' }).then(function(data) {
        return parse(data, fullpath, basepath, []);
    });
};

var identifiers = {
    includes: {
        begin: /<!--\$includetemplate\$(.+?)\$-->/,
        end: /<!--\$endincludetemplate\$-->/
    },
    puts: {
        begin: /<!--\$beginput\$(\w+?)\$-->/,
        end: /<!--\$endput\$-->/
    },
    param: {
        begin: /<!--\$beginparam\$(\w+?)\$-->/,
        end: /<!--\$endparam\$(\w+?)\$-->/
    },
    sep: '$'
};

var modules = {};

var currentModule = [],
    currentParam = [];

function parse(data, fullpath, basepath, puts) {
    var ret = '';

    var includesBeginMatch = data.match(identifiers.includes.begin),
        includesEndMatch = data.match(identifiers.includes.end),
        putsBeginMatch = data.match(identifiers.puts.begin),
        putsEndMatch = data.match(identifiers.puts.end),
        paramBeginMatch = data.match(identifiers.param.begin),
        paramEndMatch = data.match(identifiers.param.end);

    if (includesBeginMatch) var includesBeginIdx = includesBeginMatch.index;
    if (includesEndMatch) var includesEndIdx = includesEndMatch.index;
    if (putsBeginMatch) var putsBeginIdx = putsBeginMatch.index;
    if (putsEndMatch) var putsEndIdx = putsEndMatch.index;
    if (paramBeginMatch) var paramBeginIdx = paramBeginMatch.index;
    if (paramEndMatch) var paramEndIdx = paramEndMatch.index;

    var indexes = [includesBeginIdx, includesEndIdx, putsBeginIdx, putsEndIdx,
            paramBeginIdx, paramEndIdx];

    if (isFirst(includesBeginIdx, indexes)) {
        ret += data.slice(0, includesBeginIdx);
        currentModule.push({ name: includesBeginMatch[1], puts: [], content: '' });

        modules[includesBeginMatch[1]] = modules[includesBeginMatch[1]] || new Set();
        modules[includesBeginMatch[1]].add(fullpath);

        ret += parse(data.slice(includesBeginIdx + includesBeginMatch[0].length), fullpath, basepath, puts);
    }

    if (isFirst(putsBeginIdx, indexes)) {
        currentModule[currentModule.length - 1].puts.push({
            name: putsBeginMatch[1]
        });

        ret += parse(data.slice(putsBeginIdx + putsBeginMatch[0].length), fullpath, basepath, puts);
    }

    if (isFirst(putsEndIdx, indexes)) {
        currentModule[currentModule.length - 1]
            .puts[currentModule[currentModule.length - 1].puts.length - 1]
            .value = data.slice(0, putsEndIdx);

        ret += parse(data.slice(putsEndIdx + putsEndMatch[0].length), fullpath, basepath, puts);
    }

    if (isFirst(includesEndIdx, indexes)) {
        var modulePath = currentModule[currentModule.length - 1].name.split(identifiers.sep);
        var content = fs.readFileSync(
            path.join(basepath, modulePath.join(path.sep)),
            { encoding: 'utf8' }
        );

        ret += parse(content, fullpath, basepath, currentModule.pop().puts);
        ret += parse(data.slice(includesEndIdx + includesEndMatch[0].length), fullpath, basepath, puts);
    }

    if (isFirst(paramBeginIdx, indexes)) {
        ret += data.slice(0, paramBeginIdx);

        currentParam.push({ name: paramBeginMatch[1] });

        ret += parse(data.slice(paramBeginIdx + paramBeginMatch[0].length), fullpath, basepath, puts);
    }

    if (isFirst(paramEndIdx, indexes)) {
        if (isInPuts(puts, currentParam[currentParam.length - 1].name)) {
            ret += getPut(puts, currentParam[currentParam.length - 1].name);
            currentParam.pop();
        }
        else {
            ret += data.slice(0, paramEndIdx);
        }

        ret += parse(data.slice(paramEndIdx + paramEndMatch[0].length), fullpath, basepath, puts);
    }

    // Nothing left
    if (indexes.filter(Boolean).length === 0) {
        ret += data;
    }

    return ret;
}

function isFirst(i, is) {
    if (i === undefined) {
        return false;
    }

    var first = true;

    is.forEach(function(id) {
        if (id < i) {
            first = false;
        }
    });

    return first;
}

function isInPuts(puts, name) {
    return puts.some(function(put) {
        return put.name === name;
    });
}

function getPut(puts, name) {
    var ret;
    puts.forEach(function(put) {
        if (put.name === name) {
            ret = put.value;
        }
    });
    return ret;
}
