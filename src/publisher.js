'use strict';
const cp = require('child_process');
const path = require('path');

class Publisher {

    constructor(config) {
        this.config = config;
    }

    publish() {
        var target = this.config.target;
        var source = path.join(this.config.tempdir, 'nginx');
        if (!target) {
            console.log('No copy target configured.');
            return Promise.resolve();
        }
        return this.copy(source, target);
    }

    copy(source, target) {
        return new Promise((resolve, reject) => {
            var bin = path.join(__dirname, '../scripts', 'copy-redirects');
            var proc = cp.spawn(bin, [source, target], {stdio: 'inherit'});
            proc.on('close', function (code) {
                if (code === 0) {
                    resolve();
                } else {
                    reject(code);
                }
            });
        });
    }

    static run() {
        const configWeaver = require('config-weaver');
        var config = configWeaver.config();
        configWeaver.showVars(config, 'redirects');
        var publisher = new Publisher(config);
        publisher.publish()
        .catch(err => {
            console.log(err);
            process.exit(1);
        });
    }

};

module.exports = Publisher;
if (require.main === module) {
    Publisher.run();
}
