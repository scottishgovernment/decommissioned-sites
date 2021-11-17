const http = require('http');
const process = require('process');

/**
 * HTTP server that responds to publish requests.
 */
class Server {

    constructor(publisher) {
        this.publisher = publisher;
        this.server = http.createServer(this.handle.bind(this));
        this.ready = true;
    }

    port() {
        return this.server.address().port;
    }

    start() {
        this.server.listen(8000);
    }

    shutdown() {
        this.server.close();
    }

    handle(req, res) {
        if (req.method === 'POST' && req.url === '/publish') {
            this.publish(req, res);
        } else {
            this.badRequest(req, res);
        }
    }

    async publish(req, res) {
        if (this.ready) {
            this.ready = false;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            const publish = this.publisher.publish();
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
