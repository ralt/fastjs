'use strict';

var http = require('http'),
    path = require('path'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),

    handlers = require('./handlers.js'),
    fastfs = require('./fs.js');

module.exports = Fast;

function Fast(conf) {
    conf = conf || {};
    this.port = conf.port || 2504;
    this.path = conf.path || path.join(process.cwd(), 'src');

    this.start();
}

/**
 * Starts the HTTP server
 */
Fast.prototype.start = function() {
    this.server = http.createServer().listen(this.port);
    this.server.on('request', this.handleRequest.bind(this));
};

Fast.prototype.handleRequest = function(req, res) {
    var actions = req.url.split('/').filter(Boolean);

    handlers[
        actions[0] + capitalize(actions[1])
    ](decodeURIComponent(actions[2]), this.path).then(function(result) {
        res.end(result);
    }).error(function(err) {
        res.end('Error: ' + err.message);
    });
};

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
