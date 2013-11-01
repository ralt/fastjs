'use strict';

var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    chokidar = require('chokidar'),

    parse = require('./parser.js'),
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
    var that = this;
    if (fastfs.isPage(fullpath, that.path)) {
        switch (path.extname(fullpath)) {
        case '.html':
            parse(fullpath, function(content) {
                fastfs.targetPath(fullpath, that.path, function(p) {
                    fs.writeFile(p, content, check);
                });
            });
            break;
        default:
            fastfs.targetPath(fullpath, that.path, function(p) {
                fastfs.cp(fullpath, p, check);
            });
            break;
        }
    }
};

function check(err) {
    if (err) throw err;
}
