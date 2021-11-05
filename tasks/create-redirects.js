'use strict';

// Grunt task that fetches decommisioned sites and writes out the necessary nginx config files
module.exports = function(grunt) {

    var name = 'create-redirects';
    var description = 'generate nginx config for decommissioned sites';

    grunt.registerTask(name, description, function() {
        const release = this.async();
        const config = require('config-weaver').config();
        const Decommissioner = require('../src/decommissioner');
        const decommissioner = new Decommissioner(config);
        decommissioner.createRedirects()
        .then(release)
        .catch(err => {
            grunt.fail.warn('Unable to create nginx redirects:\n' + JSON.stringify(err, null, 2));
            release();
        });
    });

};
