'use strict';

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = function(fullpath) {
    return fs.readFileAsync(fullpath).then(function(data) {
        return parse(data);
    });
};

function parse(data) {
    return data;
}
