'use strict';

const config = readConfig();
function readConfig() {
    const config = {
        tempdir: process.env.WORK_DIR,
        url: process.env.URL,
        siteUrl: process.env.SITE_URL,
        target: process.env.TARGET
    };
    const entries = Object.entries(config).map(e => `  ${e[0]}=${e[1]}`);
    console.log(`Configuration:\n${entries.join('\n')}`);
    return config;
}

export default config;
