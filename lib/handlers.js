'use strict';

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),

    fastfs = require('./fs.js'),
    parse = require('./parser.js');

module.exports = {
    addHtml: addHtml,
    changeHtml: addHtml,
    addDefault: addDefault,
    changeDefault: addDefault
};


function addHtml(fullpath, basepath) {
    if (fastfs.isPage(fullpath, basepath)) {
        return parse(fullpath).then(function(content) {
            var target = fastfs.targetPath(fullpath, basepath);
            return fs.writeFileAsync(target, content);
        });
    }

    // Dummy promise
    return Promise.fulfilled();
}

function addDefault(fullpath, basepath) {
    var targetPath = fastfs.targetPath(fullpath, basepath);
    return fastfs.cp(fullpath, targetPath);
}
