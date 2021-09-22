'use strict';

/**
 * Grunt tasks used when publishing the site.
 * The copy-site and copy-redirects tasks run a shell script that copies the
 * generated site to a directory or S3 bucket, depending on configuration.
 */
module.exports = function(grunt) {

    var config = require('config-weaver').config();
    var path = require('path'),
        cp = require('child_process');

    function publish(script, source, target, callback) {
        var bin = path.join(__dirname, '../scripts', script);
        var proc = cp.spawn(bin, [source, target], {stdio: 'inherit'});
        proc.on('close', function (code) {
            callback(code);
        });
    }

    function runPublishScript(script, source, target, callback) {
        if (!target) {
            console.log('No copy target configured.');
            callback(true);
        } else {
            publish(script, source, target, callback);
        }
    }

    grunt.registerTask('copy-redirects', 'Publish redirects', function() {
        var release = this.async();
        var target = config.target;
        var source = path.join(config.tempdir, 'nginx');
        runPublishScript('copy-redirects', source, target, release);
    });

};
