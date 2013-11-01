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
    this.path = conf.path || path.join(process.cwd(), 'src');

    this.start();
}

/**
 * Starts the HTTP server and the fs watcher.
 */
Fast.prototype.start = function() {
    var that = this;
    fastfs.checkDirectories(this.path, function() {
        that.server = http.createServer().listen(that.port);
        that.server.on('request', that.handleRequest);

        that.watcher = chokidar.watch(that.path, { persistent: true });
        that.watcher.on('all', that.handleFile.bind(that));
    });
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
