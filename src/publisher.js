const rimraf = require('rimraf');
const path = require('path');
const util = require('util');
const Copy = require('./copy');
const Decommissioner = require('./decommissioner');
const Serf = require('./serf');

class Publisher {

    constructor(config) {
        this.config = config;
        this.decommissioner = new Decommissioner(config);
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

    async publish() {
        const rm = util.promisify(rimraf);
        await rm(path.join(this.config.tempdir, 'nginx'));
        await this.decommissioner.createRedirects();
        await this.copy.publish();
        return this.serf.publish();
    }

    static async run() {
        const configWeaver = require('config-weaver');
        var config = configWeaver.config();
        configWeaver.showVars(config, 'redirects');
        var publisher = new Publisher(config);
        await publisher.start();
        await publisher.publish();
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
