const fs = require('fs');
const util = require('util');
const Decommissioner = require('../src/decommissioner');

describe('decommissioner', function() {

    var testRest = require('./test-decommissioned-sites-server')();
    var authPort = 1110
    var testAuthPort = 1111;
    var tempDir = __dirname + '/../out';

    beforeEach(function(done) {
        const mkdir = util.promisify(fs.mkdir);
        mkdir(tempDir, { recursive: true })
        .then(done);
    });

    function test(config, port, sites, pages, done) {
        const server = testRest.startGreenpathServer(port, sites, pages);

        var decommissioner = new Decommissioner(config);
        var error = undefined;
        decommissioner.createRedirects()
        .then(_ => {
            var redirectFile = fs.readFileSync(tempDir + '/nginx/decommissioned/alpha.mygov.scot.conf');
        })
        .catch(err => {
          error = err;
        })
        .finally(() => {
            server.close(function(e) {
                done(error || e);
            });
        });
    }

    it('green path (no auth)', function(done) {

        var testPort = 1113;
        var baseSitesUrl = 'http://localhost:'+testPort+'/redirects/sites/';
        var basePagesUrl = 'http://localhost:'+testPort+'/redirects/sites/';

        var sites = {
            "_embedded" : {
                "sites" : [ {
                    "id" : "alpha",
                    "host" : "alpha.mygov.scot",
                    "name" : "Test Name",
                    "description" : "Test Desc",
                    "siteMatchMsg" : "site msg",
                    "categoryMatchMsg" : "category msg",
                    "pageMatchMsg" : "page msg",
                    "_links" : {
                        "self" : {
                            "href" : baseSitesUrl+"alpha",
                        },
                        "pages" : {
                            "href" : baseSitesUrl+"alpha/pages"
                        }
                    }
                } ]
            }
        };
        var pages = [
            {
                "id": "alpha",
                "response": {
                    "_embedded" : {
                        "pages" : [
                            {
                                "srcUrl": "/srcUrl/",
                                "targetUrl": "/target/url/",
                                "redirectType": "REDIRECT"
                            }
                        ]
                    }
                }
            }];
        var config = {
            tempdir: tempDir,
            siteUrl: 'https://www.mygov.scot/',
            url: `http://localhost:${testPort}/`
        };
        test(config, testPort, sites, pages, done);
    });

});
