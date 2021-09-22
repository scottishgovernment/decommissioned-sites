'use strict';

// Grunt task that fetches decommisioned sites and writes out the necessary nginx config files
module.exports = function(grunt) {

    var config = require('config-weaver').config();

    var name = 'create-redirects';
    var description = 'generate nginx config for decommissioned sites';

    grunt.registerTask(name, description, function() {
        var release = this.async();
        var decommissioner = require('../src/decommissioner')(config);
        decommissioner.createRedirects(release, function (err) {
            if (err !== undefined) {
                grunt.fail.warn('Unable to create nginx redirects: ' + JSON.stringify(err));
            }
            release();
        });
    });

};
