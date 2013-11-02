'use strict';

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs'));

module.exports = function(fullpath) {
    return fs.readFileAsync(fullpath, { encoding: 'utf8' }).then(function(data) {
        return parse(data);
    });
};

var regexes = {
    includes: {
        begin: ['<!--$includetemplate$', '$-->'],
        end: '<!--$endincludetemplate$-->'
    },
    puts: {
        begin: ['<!--$beginput$', '$-->'],
        end: '<!--$endput$-->'
    }
};

function parse(data) {
    var ret;

    return ret;
}
