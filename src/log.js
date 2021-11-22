const nano = require('nano');

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
            .map(r => r.doc);
        docs.forEach(d => {
            delete d._id;
            delete d._rev;
        });
        return docs;
    }

}

module.exports = Log;
if (require.main === module) {
    const log = new Log();
    log.record('martin.ellis@gov.scot', new Date(), new Date())
    .then(() => { return log.get(); })
    .then(o => JSON.stringify(o, null, 2))
    .then(console.log);
}
