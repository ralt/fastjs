'use strict';

var Promise = require('bluebird'),
    Set = require('simplesets').Set,
    path = require('path'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = function(fullpath, basepath) {
    return fs.readFileAsync(fullpath, { encoding: 'utf8' }).then(function(data) {
        //return parse(data, fullpath, basepath, []);
        return JSON.stringify(parsePage(makePage('root'), data, fullpath, basepath), null, '    ');
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

function makePage(name) {
    return {
        name: name,
        modules: [],
        content: '',
        puts: [],
        params: []
    };
}

function makePuts(name) {
    return {
        name: name,
        value: ''
    };
}

function makeParam(name) {
    return {
        name: name,
        value: ''
    };
}

function parsePage(page, content, fullpath, basepath) {
    console.log('=======       page');
    console.log(page);
    console.log('=======       content');
    console.log(content);

    var includesBeginMatch = content.match(identifiers.includes.begin),
        includesEndMatch = content.match(identifiers.includes.end),
        putsBeginMatch = content.match(identifiers.puts.begin),
        putsEndMatch = content.match(identifiers.puts.end),
        paramBeginMatch = content.match(identifiers.param.begin),
        paramEndMatch = content.match(identifiers.param.end);

    if (includesBeginMatch) var includesBeginIdx = includesBeginMatch.index;
    if (includesEndMatch) var includesEndIdx = includesEndMatch.index;
    if (putsBeginMatch) var putsBeginIdx = putsBeginMatch.index;
    if (putsEndMatch) var putsEndIdx = putsEndMatch.index;
    if (paramBeginMatch) var paramBeginIdx = paramBeginMatch.index;
    if (paramEndMatch) var paramEndIdx = paramEndMatch.index;

    var indexes = [includesBeginIdx, includesEndIdx, putsBeginIdx, putsEndIdx,
            paramBeginIdx, paramEndIdx];

    if (isFirst(includesBeginIdx, indexes)) {
        page.content += content.slice(0, includesBeginIdx - 1);

        modules[includesBeginMatch[1]] = modules[includesBeginMatch[1]] || new Set();
        modules[includesBeginMatch[1]].add(fullpath);

        page.modules.push(makePage(includesBeginMatch[1]));

        return parsePage(page.modules.last(), content.slice(includesBeginIdx + includesBeginMatch[0].length), fullpath, basepath);
    }

    if (isFirst(putsBeginIdx, indexes)) {
        page.puts.push(makePuts(putsBeginMatch[1]));

        return parsePage(page, content.slice(putsBeginIdx + putsBeginMatch[0].length), fullpath, basepath);
    }

    if (isFirst(putsEndIdx, indexes)) {
        page.puts.last().value = content.slice(0, putsEndIdx);

        return parsePage(page, content.slice(putsEndIdx + putsEndMatch[0].length), fullpath, basepath);
    }

    if (isFirst(includesEndIdx, indexes)) {
        var modulePath = page.name.split(identifiers.sep);
        var data = fs.readFileSync(
            path.join(basepath, modulePath.join(path.sep)),
            { encoding: 'utf8' }
        );

        return parsePage(page, data, fullpath, basepath);
    }

    if (isFirst(paramBeginIdx, indexes)) {
        page.content += data.slice(0, paramBeginIdx);

        return parsePage(page, content.slice(paramBeginIdx + paramBeginMatch[0].length), fullpath, basepath);
    }

    if (isFirst(paramEndIdx, indexes)) {
        page.params.last.value = content.slice(0, paramEndIdx);

        return parsePage(page, content.slice(paramEndIdx + paramEndMatch[0].length), fullpath, basepath);
    }

    page.content += content;

    return page;
}

Array.prototype.last = function() {
    return this[this.length - 1];
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
