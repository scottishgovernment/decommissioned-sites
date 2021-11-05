'use strict';

module.exports = function(grunt) {

    var path = require('path');

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Load configuration.
    var gruntConfig = grunt.file.readYAML('config.yaml');

    // copy the tempdir from config weaver to the grunt config.
    gruntConfig.tempdir = require('config-weaver').config().tempdir;

    require('load-grunt-config')(grunt, {
        init: true,
        data: {
            site: gruntConfig,
            tempdir: gruntConfig.tempdir
        },
        loadGruntTasks: false
    });

    require('jit-grunt')(grunt, {});

};
