'use strict';

var net = require('net');
var msgpack = require('msgpack5')();
var logger = require('./logger');
var encode = msgpack.encode;
var decode = msgpack.decode;

/**
 * Serf client.
 * This is used to notify web servers that a publish has completed, so that they
 * can pull the latest content.
 */
 class Serf {

    constructor(options) {
        var opts = options || {};
        this.host = opts.host || 'localhost';
        this.port = opts.port || 7373;
        this.timeout = opts.timeout || 10000;
        this.retrying = false;
        this.socket = this.createSocket();
    }

    /**
     * Creates a socket for this end of the connection.
     * This function creates the socket only - it doesn't establish a connection.
     */
    createSocket() {
        var socket = new net.Socket();
        socket.on('connect', this.connect.bind(this));
        socket.on('data',    this.data.bind(this));
        socket.on('end',     this.end.bind(this));
        socket.on('error',   this.error.bind(this));
        socket.on('close',   this.close.bind(this));
        return socket;
    }

    /**
     * Establishes a connection with the server.
     * The callback is called when the connection is established.
     */
    start(done) {
        this.callback = done;
        this.dial();
    }

    stop(done) {
        this.socket.end(done);
        this.retrying = true;
    }

    dial() {
        this.log('connecting to ' + this.host + ':' + this.port);
        this.retrying = false;
        this.sequence = 0;
        this.socket.connect(this.port, this.host);
    }

    redial() {
        if (!this.retrying) {
            this.retrying = true;
            this.log('reconnect in ' + this.timeout + 'ms');
            setTimeout(this.dial.bind(this), this.timeout);
        }
    }

    connect() {
        this.log('connection established');
        this.handshake();
        if (this.callback) {
            console.log('callback');
            this.callback();
        }
    }

    handshake() {
        var header = {
            Command: 'handshake',
            Seq: this.sequence++
        };
        var body = {
            Version: 1
        };
        this.send(header, body);
    }

    publish() {
        var event = {
            type: 'publish-redirects',
            time: new Date()
        };
        this.event('publish', JSON.stringify(event), true);
    }

    event(name, payload, coalesce) {
        var header = {
            Command: 'event',
            Seq: this.sequence++
        };
        var body = {
            Name: name,
            Payload: payload,
            Coalesce: coalesce
        };
        this.log(name + ' event: ' + payload);
        this.send(header, body);
    }

    send(header, body) {
        this.log('sending header: ' + JSON.stringify(header));
        this.log('sending body:   ' + JSON.stringify(body));
        this.socket.write(encode(header));
        this.socket.write(encode(body));
    }

    /**
     * Event handler for when data is received on the connection.
     */
    data(data) {
        var messages = this.split(data);
        for (var i = 0; i < messages.length; i++) {
            var message = messages[i];
            var error = message['Error'];
            this.log('received: ack ' + message['Seq'] + (error ? ' ' + error : ''));
        }
    }

    /**
     * Decodes msgpack messages in a buffer, and returns them as an array.
     */
    split(data) {
        var messages = [];
        do {
            var message = decode(data);
            messages.push(message);
            data = data.slice(encode(message).length);
        } while (data.length);
        return messages;
    }

    /**
     * Event handler for when the server closes the connection.
     */
    end() {
        this.log('server closed the connection');
        this.redial();
    }

    /**
     * Event handler for when a connection error occurs.
     */
    error() {
        this.log('connection error');
        this.redial();
    }

    /**
     * Event handler for when the connection is closed.
     * This event occurs after an end or error event.
     */
    close() {
        if (!this.retrying) {
            this.log('close');
        }
        this.redial();
    }

    log(message) {
        logger.info('serf: ' + message);
    }

}

module.exports = Serf;
