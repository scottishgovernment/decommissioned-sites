const nano = require('nano');

/**
 * Stores publish events in CouchDB.
 */
class Log {

    constructor(url) {
        this.url = url || 'http://localhost:5984/publish';
        this.db = nano(this.url);
    }

    async record(user, start, end) {
        const record = {
            type: 'publish',
            what: 'redirects',
            user: user,
            start: start.toISOString(),
            end: end.toISOString()
        };
        return await this.db.insert(record);
    }

    async get() {
        const list = await this.db.list({
            include_docs: true,
            descending: true,
            limit: 10
        });
        const docs = list.rows
            .filter(d => !d.id.startsWith('_'))
            .map(r => r.doc)
            .map(r => {
                const buildTime = new Date(r.end) - new Date(r.start);
                return {
                    createdby: r.user,
                    created: r.start,
                    buildTime: buildTime
                };
            });
        docs.forEach(d => {
            delete d._id;
            delete d._rev;
        });
        return docs;
    }

}

module.exports = Log;
