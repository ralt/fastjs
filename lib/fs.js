'use strict';

var path = require('path'),
    Promise = require('bluebird'),
    copyFileAsync = Promise.promisify(copyFile),
    fs = Promise.promisifyAll(require('fs')),
    mkdirpAsync = Promise.promisify(require('mkdirp'));

module.exports = {
    isPage: isPage,
    targetPath: targetPath,
    cp: cp
};

function isPage(fullpath, basePath) {
    var pagePath = path.join(basePath, 'pages');
    return fullpath.indexOf(pagePath) === 0;
}

function targetPath(fullpath, basePath) {
    var tmppath = basePath.split(path.sep),
        newpath = path.join(basePath, '..', 'target'),
        srctmp = fullpath.split(path.sep),
        end = [];

    tmppath.pop();


    while (srctmp.join(path.sep) !== tmppath.join(path.sep)) {
        end.unshift(srctmp.pop());
    }

    // Remove src/
    end.shift();
    // Remove pages/
    end.shift();

    return path.join(newpath, end.join(path.sep));
}

function cp(source, target) {
    var targetdir = target.split(path.sep);
    targetdir.pop();
    targetdir = targetdir.join(path.sep);

    return mkdirpAsync(targetdir).then(function() {
        return copyFileAsync(source, target);
    });
}

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
