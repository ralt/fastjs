'use strict';

var fs = require('fs');

module.exports = function(fullpath, cb) {
    fs.readFile(fullpath, function(err, data) {
        if (err) throw err;

        cb(parse(data));
    });
}

function parse(data) {
    return data;
}
