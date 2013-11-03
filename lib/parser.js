'use strict';

var Promise = require('bluebird'),
    Set = require('simplesets').Set,
    path = require('path'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = function(fullpath, basepath) {
    return fs.readFileAsync(fullpath, { encoding: 'utf8' }).then(function(data) {
        return parse(data, fullpath, basepath);
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
    },
    param: {
        begin: /<!--\$beginparam\$(\w+)\$-->/,
        end: /<!--\$endparam\$(\w+)\$-->/
    },
    sep: '$'
};

var modules = {};

var currentModule = [];

function parse(data, fullpath, basepath, puts) {
    var ret;

    var includesBeginMatch = data.match(identifiers.includes.begin),
        includesEndMatch = data.match(identifiers.includes.end),
        putsBeginMatch = data.match(identifiers.puts.begin),
        putsEndMatch = data.match(identifiers.puts.end),
        paramBeginMatch = data.match(identifiers.param.begin),
        paramEndMatch = data.match(identifiers.param.end),

        includesBeginIdx = includesBeginMatch.index,
        includesEndIdx = includesEndMatch.index,
        putsBeginIdx = putsBeginMatch.index,
        putsEndIdx = putsEndMatch.index,
        paramBeginIdx = paramBeginMatch.index,
        paramEndIdx = paramEndMatch.index,

        indexes = [includesBeginIdx, includesEndIdx, putsBeginIdx, putsEndIdx,
            paramBeginIdx, paramEndIdx];

    if (isFirst(includesBeginIdx, indexes)) {
        ret += data.slice(0, includesBeginIdx);
        currentModule.push({ name: includesBeginMatch[1], puts: [] });

        modules[includesBeginMatch[1]] = modules[includesBeginMatch[1]] || new Set();
        modules[includesBeginMatch[1]].add(fullpath);

        return parse(data.slice(includesBeginIdx + includesBeginMatch[0].length), fullpath);
    }

    if (isFirst(putsBeginIdx, indexes)) {
        currentModule[currentModule.length - 1].puts.push({
            name: putsBeginMatch[1]
        });

        return parse(data.slice(putsBeginIdx + putsBeginMatch[0].length), fullpath);
    }

    if (isFirst(putsEndIdx, indexes)) {
        currentModule[currentModule.length - 1]
            .puts[currentModule[currentModule.length - 1].puts.length - 1]
            .value = data.slice(0, putsEndIdx);

        return parse(data.slice(putsEndIdx + putsEndMatch[0].length), fullpath);
    }

    if (isFirst(includesEndIdx, indexes)) {
        var modulePath = currentModule[currentModule.length - 1].name.split(identifiers.sep);
        fs.readFileAsync(
            path.join(basepath, modulePath.join(path.sep))
        ).then(function(content) {
            ret += parse(content, fullpath, basepath, currentModule.puts);
            currentModule.pop();
        });
    }

    if (isFirst(paramBeginIdx, indexes)) {
        ret += data.slice(0, paramBeginIdx);

        currentParam.push({ name: paramBeginMatch[1] });
        return parse(data.slice(paramBeginIdx + paramBeginMatch[0].length), fullpath, basepath, puts);
    }

    if (isFirst(paramEndIdx, indexes)) {
        if (isInPuts(puts, currentParam[currentParam.length - 1].name)) {
            ret += getPut(puts, currentParam[currentParam.length - 1].name);
        }
        else {
            ret += data.slice(0, paramEndIdx);
        }

        return parse(data.slice(paramEndIdx + paramEndMatch[0].length, fullpath, basepath, puts));
    }

    return ret;
}

function isFirst(i, is) {
    return is.every(function(in) {
        return in < i;
    });
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
