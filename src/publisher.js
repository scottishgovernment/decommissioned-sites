const rimraf = require('rimraf');
const path = require('path');
const util = require('util');
const Copy = require('./copy');
const Decommissioner = require('./decommissioner');
const Serf = require('./serf');
const Log = require('./log');

class Publisher {

    constructor(config) {
        this.config = config;
        this.decommissioner = new Decommissioner(config);
        this.log = new Log(config.database);
        this.copy = new Copy(config);
        this.serf = new Serf();
    }

    start() {
        return new Promise((resolve, reject) => {
            this.serf.start(resolve);
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.serf.stop(resolve);
        });
    }

    async publish(user) {
        const rm = util.promisify(rimraf);
        const start = new Date();
        await rm(path.join(this.config.tempdir, 'nginx'));
        await this.decommissioner.createRedirects();
        await this.copy.publish();
        await this.serf.publish();
        const end = new Date();
        await this.log.record(user, start, end);
    }

    static async run() {
        const configWeaver = require('config-weaver');
        var config = configWeaver.config();
        configWeaver.showVars(config, 'redirects');
        var publisher = new Publisher(config);
        await publisher.start();
        await publisher.publish('admin@mygov.scot');
        return publisher.stop()
        .catch(err => {
            console.log(err);
            process.exit(1);
        });
    }

}

module.exports = Publisher;
if (require.main === module) {
    Publisher.run();
}
