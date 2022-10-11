const fs = require('fs');
const got = require('got');
const handlebars = require('handlebars');
const path = require('path');
const util = require('util');

class Decommissioner {

    constructor(config) {
        const pagesTemplateSrc = fs.readFileSync(__dirname + '/vhost.hbs', 'UTF-8');
        this.config = config;
        this.pagesTemplate = handlebars.compile(pagesTemplateSrc);
        this.outputDir = path.join(this.config.tempdir, 'nginx', 'decommissioned');
    }

    async createRedirects() {
        const mkdir = util.promisify(fs.mkdir);
        await mkdir(this.outputDir, { recursive: true });
        const sites = await this.fetchSites();
        return await this.fetchPagesForSites(sites);
    }

    fetchSites() {
        console.log('fetchSites');
        const url = `${this.config.url}redirects/sites?size=50`;
        return got(url).json();
    }

    async fetchPagesForSites(sitesHAL) {
        console.log('fetchPagesForSites');
        if (sitesHAL._embedded && sitesHAL._embedded.sites) {
            const sites = sitesHAL._embedded.sites;
            for (const site of sites) {
                await this.processSite(site)
                .catch(error => {
                    console.log('Error fetching pages: ' + JSON.stringify(error));
                    return Promise.reject(error);
                });
            }
        }
    }

    escapeRegExpChars(str) {
        return str.replace(/['-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    sourceUrl(page) {
        var srcUrl = page.srcUrl;

        if (page.type === 'EXACT') {
            srcUrl = this.escapeRegExpChars(decodeURI(srcUrl));
        }

        var endsWithSlash = srcUrl.charAt(srcUrl.length - 1) === '/';
        return '(?i)^' + srcUrl + (endsWithSlash ? '?' : '/?') + '$';
    }

    // if the target url is a fully qualified url then just use it as the target url.
    // Otherwise add the base URL to the front.
    targetUrl(target, base) {
        const targetUrl = new URL(target, base);
        const addVia = [
            'www.gov.scot',
            'www.mygov.scot',
            'blogs.gov.scot'
        ].includes(targetUrl.host);
        if (addVia) {
            targetUrl.search = targetUrl.search
                + (targetUrl.search && '&' || '?')
                + 'via=$scheme://$host$request_uri';
        }
        return targetUrl.toString();
    }

    // The redirect type is the flag used on the rewrite directive
    // It can only have the values redirect or permanent, lower-case, and default
    // to permanent.
    sanitiseRedirectType(page) {
        var type = page.redirectType;
        if (type && type.toLowerCase() === 'redirect') {
            return 'redirect';
        }
        return 'permanent';
    }

    async processSite(site) {
        console.log(`processSite ${site.name}`);
        const pages = await this.fetchPagesForSite(site);
        await this.writeRedirects(site, pages);
    }

    fetchPagesForSite(site) {
        const url = site._links.pages.href;
        console.log(`fetchPagesForSite ${url}`);
        return got(url).json();
    }

    sortComparison(a, b) {
        if (a.type === b.type) {
            return a.srcUrl.localeCompare(b.srcUrl);
        }
        if (a.type === 'EXACT') {
            return -1;
        }
        return 1;
    }

    writeRedirects(site, pagesJSON) {
        var siteUrl = this.config.siteUrl;

        // sort the pages so that exact matches come first followed by regexps
        const sortedPages = pagesJSON._embedded.pages.sort(this.sortComparison);

        var pages = sortedPages.map(page => {
            return {
                source: this.sourceUrl(page),
                target: this.targetUrl(page.targetUrl, siteUrl),
                rewriteFlag: this.sanitiseRedirectType(page)
            };
        });

        var srcDoc = {
            name: site.name,
            host: site.host,
            catchAllUri: this.targetUrl(site.catchAllUri || '', siteUrl),
            pages: pages
        };

        var content = this.pagesTemplate(srcDoc);

        const filename = site.host.split(' ')[0] + '.conf';
        const pathname = path.join(this.outputDir, filename);
        const writeFile = util.promisify(fs.writeFile);
        return writeFile(pathname, content, 'UTF-8');
    }

    static run() {
        const configWeaver = require('config-weaver');
        var config = configWeaver.config();
        configWeaver.showVars(config, 'redirects');
        var decommissioner = new Decommissioner(config);
        decommissioner.createRedirects()
        .catch(err => {
            console.log(err);
            process.exit(1);
        });
    }
}

module.exports = Decommissioner;
if (require.main === module) {
    Decommissioner.run();
}
