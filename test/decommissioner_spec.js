var sutPath = '../out/instrument/src/decommissioner';

describe('decommissioner', function() {

    var testRest = require('./test-decommissioned-sites-server')();
    var authPort = 1110
    var testAuthPort = 1111;
    var tempDir = __dirname + '/../out/decommission';

    beforeEach(function(done) {

        var temp = require('temp');
        temp.mkdir('',
            function(err, dirPath) {
                tempDir = dirPath;
                done();
            }
        );
    });

    function test(config, port, sites, pages, done) {

        testRest.startGreenpathServer(port, sites, pages);

        var sut = require(sutPath)(config);
        sut.createRedirects(function (err) {
            var redirectFile = require('fs').readFileSync(tempDir + '/nginx/decommissioned/alpha.mygov.scot.conf');
            done();
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
