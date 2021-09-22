module.exports = function (grunt, options) {
    var fs = require('fs');
    var path = require('path');

    var packageJSON = grunt.file.readJSON('package.json');
    var tokenFile = path.join(process.env.HOME, '.sonar/token');
    var token;
    if (fs.existsSync(tokenFile)) {
        token = fs.readFileSync(tokenFile).toString().trim();
    }

    var createSonarConfiguration = function(mode) {
        var options = {
            sonar: {
                analysis: {
                    mode: mode
                },
                host: {
                    url: 'http://sonar.digital.gov.uk'
                },
                projectKey: "decommissioned-sites",
                projectName: "Decommissioned Sites",
                projectVersion: packageJSON.version,
                projectDescription: packageJSON.description,
                sources: [
                    'src'
                ].join(','),
                language: 'js',
                sourceEncoding: 'UTF-8',
                javascript: {
                    lcov: {
                        reportPath: 'out/coverage/lcov.info'
                    }
                }
            }
        };
        if (token) {
        options.sonar.login = token;
        }
        return options;
    };

    return {
        analysis: {
            options: createSonarConfiguration('publish')
        },
        preview: {
            options: createSonarConfiguration('issues')
        }
    };

};
