var Serf = require('../src/serf.js');

const net = require('net');
const { setFlagsFromString } = require('v8');
const msgpack = require('msgpack5')();
const encode = msgpack.encode;
const decode = msgpack.decode;

describe('Serf client', function() {

    // Test server that the client connects to (a net.Server instance).
    var server;

    // The current server socket (a net.Socket instance).
    var connection;

    // Function to be called when the next client message is received.
    // The first argument is the message that was received.
    // This is reassigned to match the current protocol state.
    var dataReceived;

    // The serf client under test.
    var serf;

    // The sequence number from the last header message sent by the client.
    var sequence;

    // Function that will be called when the client establishes a connection
    // The first parameter is the net.Socket instance for the server socket.
    var connectionHandler;

    beforeEach(function(done) {
        setupServer(done);
        serf = createInstance();
        dataReceived = expectHandshakeHeader;
    });

    afterEach(() => {
        serf.stop();
        server.close();
    });

    it('should have reasonable defaults', function () {
        serf = new Serf();
        expect(serf.port).toBe(7373);
        expect(serf.host).toBe('localhost');
        expect(serf.timeout).toBeGreaterThan(1);
    });

    xit('should reconnect if the server drops the connection', function (done) {
        var first = true;
        connectionHandler = makeConnectionHandler((message) => {
            // drop the connection after the client sends the handshake
            if (dataReceived !== expectEventHeader) {
                return;
            }
            if (first) {
                connection.end();
                dataReceived = expectHandshakeHeader;
                first = false;
            } else {
                serf.retrying = true;
                setTimeout(done, 0);
            }
        });
        serf.start();
    });

    it('should send a user event for a publish', function (done) {
        connectionHandler = makeConnectionHandler((message) => {
            if (message.Name === 'publish') {
                connection.end();
                serf.retrying = true;
                setTimeout(done, 0);
            }
        });
        serf.start(() => {
            serf.publish();
        });
    });

    function createInstance() {
        return new Serf({
            port: server.address().port,
            timeout: 1
        });
    }

    function setupServer(done) {
        if (server) {
            done();
        }
        server = net.createServer({ pauseOnConnect: true }, (c) => {
            connection = c;
            connectionHandler(c);
        });
        server.on('error', (err) => {
            throw err;
        });
        server.listen(0, function() {
            done();
        });
    }

    function makeConnectionHandler(messageHandler) {
        return (conn) => {
            connection = conn;
            connection.on('data', (data) => {
                var incoming = serf.split(data);
                for (var i = 0; i < incoming.length; i++) {
                    var message = incoming[i];
                    dataReceived(message);
                    messageHandler(message);
                }
            });
            connection.resume();
        };
    }

    function expectHandshakeHeader(data) {
        console.log('expecting handshake header');
        expect(data['Command']).toBe('handshake');
        expect(data['Seq']).toBe(0);
        sequence = data['Seq'];
        dataReceived = expectHandshakeBody;
    }

    function expectHandshakeBody(data) {
        console.log('expecting handshake body');
        expect(data['Version']).toBe(1);
        connection.write(encode({"Seq": sequence, "Error": ""}));
        dataReceived = expectEventHeader;
    }

    function expectEventHeader(data) {
        console.log('expecting event header');
        expect(data['Command']).toBe('event');
        expect(data['Seq']).toBeGreaterThan(sequence);
        sequence = data['Seq'];
        dataReceived = expectEventBody;
    }

    function expectEventBody(data) {
        console.log('expecting event body');
        expect(data['Name']).toBe('publish');
        connection.write(encode({"Seq": sequence, "Error": ""}));
        dataReceived = null;
    }

});
