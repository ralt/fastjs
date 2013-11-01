'use strict';

var path = require('path'),
    fs = require('fs');

module.exports = {
    isPage: function(fullpath, basePath) {
        var pagePath = path.join(basePath, 'pages');
        return fullpath.indexOf(pagePath) === 0;
    },

    targetPath: function(fullpath, basePath, cb) {
        var tmppath = basePath.split(path.sep),
            newpath = path.join(basePath, '..', 'target'),
            srctmp = fullpath.split(path.sep),
            end = [],
            p;

        tmppath.pop();


        while (srctmp.join(path.sep) !== tmppath.join(path.sep)) {
            end.unshift(srctmp.pop());
        }

        // Remove src/
        end.shift();
        // Remove pages/
        end.shift();

        p = path.join(newpath, end.join(path.sep));

        console.log(p);
        cb(p)
    },

    cp: function(source, target, cb) {
        var targetdir = target.split(path.sep);
        targetdir.pop();
        targetdir = targetdir.join(path.sep);

        fs.exists(targetdir, function(exists) {
            if (!exists) {
                mkdirp(targetdir, function(err) {
                    if (err) throw err;

                    copyFile(source, target, cb);
                });
            }
            else {
                copyFile(source, target, cb);
            }
        });
    },

    checkDirectories: function(basePath, cb) {
        var required = [
            basePath,
            path.join(basePath, 'modules'),
            path.join(basePath, 'pages')
        ],
            r;

        while (r = required.shift()) {
            (function(r) {
                fs.exists(r, function(exists) {
                    if (!exists) {
                        throw new Error('The ' + r +
                            ' directory is required.');
                    }
                });
            }(r));
        }

        cb();
    }
};

// From http://stackoverflow.com/a/14387791/851498
function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });

    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });

    wr.on("close", function(ex) {
        done();
    });

    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}
