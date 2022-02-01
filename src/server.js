const http = require('http');
const process = require('process');

/**
 * HTTP server that responds to publish requests.
 */
class Server {

    constructor(publisher, log) {
        this.publisher = publisher;
        this.log = log;
        this.server = http.createServer(this.handle.bind(this));
        this.ready = true;
    }

    port() {
        return this.server.address().port;
    }

    start() {
        this.server.listen(8098);
    }

    shutdown() {
        this.server.close();
    }

    handle(req, res) {
        const port = this.port();
        const url = new URL(req.url, `http://localhost:${port}`);
        console.log(`${req.method} ${url.pathname}`);
        if (req.method === 'GET' && url.pathname === '/log') {
            this.getLog(req, res);
        } else if (req.method === 'POST' && url.pathname === '/publish') {
            this.publish(req, res);
        } else {
            this.badRequest(req, res);
        }
    }

    async getLog(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        const log = await this.log.get();
        res.end(JSON.stringify({
            pubs: log
        }, null, 2));
    }

    async publish(req, res) {
        const user = req.headers['x-user'] || '';
        console.log(`Publish started by ${user}`);
        if (this.ready) {
            this.ready = false;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            const publish = this.publisher.publish(user);
            res.end(JSON.stringify({
                ok: 'Publish started'
            }, null, 2));
            await publish;
            this.ready = true;
        } else {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Publish already in progress'
            }, null, 2));
        }
    }

    badRequest(req, res) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Bad request'
        }));
    }

}

module.exports = Server;

if (require.main === module) {
    const server = new Server();
    server.start();
    process.on('SIGINT', () => {
        console.log('Received SIGINT.');
        server.shutdown();
    });
    console.log(server.port());
}
