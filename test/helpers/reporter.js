const reporters = require('jasmine-reporters');
const reporter = new reporters.JUnitXmlReporter({
    savePath: 'out/reports',
    consolidateAll: true
});
jasmine.getEnv().addReporter(reporter);
