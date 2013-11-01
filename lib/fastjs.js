'use strict';

var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    chokidar = require('chokidar'),

    fastfs = require('./fs.js');

module.exports = Fast;

function Fast(conf) {
    conf = conf || {};
    this.port = conf.port || 2504;
    this.path = conf.path || '/home/florian/tmp/src';

    this.start();
}

/**
 * Starts the HTTP server and the fs watcher.
 */
Fast.prototype.start = function() {
    this.server = http.createServer().listen(this.port);
    this.server.on('request', this.handleRequest);

    this.watcher = chokidar.watch(this.path, { persistent: true });
    this.watcher.on('all', this.handleFile.bind(this));
};

Fast.prototype.handleRequest = function(req, res) {
    res.end();
};

Fast.prototype.handleFile = function(type, fullpath) {
    if (fastfs.isPage(fullpath, this.path)) {
        switch (path.extname(fullpath)) {
        case '.html':
            parse(fullpath, function(content) {
                put(this.path, fullpath, content);
            });
            break;
        default:
            fastfs.targetPath(fullpath, this.path, function(p) {
                fastfs.cp(fullpath, p, check);
            });
        }
    }
};

function parse(fullpath, cb) {
}

function check(err) {
    if (err) throw err;
}
