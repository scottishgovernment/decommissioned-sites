'use strict';

/**
 * Grunt tasks used when publishing the site.
 * The copy-redirects task runs a shell script that copies the
 * generated redirects to a directory or S3 bucket, depending on configuration.
 */
module.exports = function(grunt) {

    const config = require('config-weaver').config();

    grunt.registerTask('copy-redirects', 'Publish redirects', function() {
        var release = this.async();
        const Publisher = require('../src/publisher');
        const publisher = new Publisher(config);
        publisher.publish()
        .then(release)
        .catch(err => {
            grunt.fail.warn('Unable to copy redirects:\n' + JSON.stringify(err, null, 2));
            release();
        });
    });

};
