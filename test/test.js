'use strict';

var http = require('http');
var request = require('request');
var expect = require('expect.js');
var replay = require('../');

describe('request-replay', function () {
    var server;

    beforeEach(function (next) {
        if (server) {
            server.close(next);
            server = null;
        } else {
            next();
        }
    });

    it('should replay on network error', function (next) {
        replay(request.get('http://somedomainthatwillneverexistforsure.com:8089', function (error) {
            expect(error).to.be.an(Error);
            expect(['ENOTFOUND', 'EADDRINFO']).to.contain(error.code);
            expect(error.replays).to.equal(5);
            next();
        }), {
            minTimeout: 10,
            maxTimeout: 10
        });
    });

    it('should replay on http error', function (next) {
        this.timeout(15000);

        var number = 0;
        replay(request.get('http://httpbin.org/status/500', function (error, response) {
            expect(response.statusCode).to.equal(500);
            next();
        }), {
            factor: 1,
            minTimeout: 10,
            maxTimeout: 10
        }).on('replay', function (replay) {
            expect(replay.error.statusCode).to.equal(500);
            expect(replay.number).to.equal(number);
            number++;
        });
    });

    it('should succeed if first fails but one of others succeed', function (next) {
        var tries = 0;

        this.timeout(15000);

        replay(request.get('http://127.0.0.1:8089', { json: true }, function (error, response, body) {
            expect(error).to.be(null);
            expect(response).to.be.ok();
            expect(body).to.eql({ 'foo': 'bar' });
            expect(tries).to.be(1);
            next();
        }), {
            errorCodes: ['ECONNREFUSED'],
            minTimeout: 10,
            maxTimeout: 10
        })
        .on('replay', function () {
            tries++;

            server = http.createServer(function (req, res) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end('{ "foo": "bar" }');
            })
            .listen(8089, '127.0.0.1');
        });
    });

    it('should fire a replay event on each retry', function (next) {
        var stream;
        var tries = 0;

        stream = replay(request.get('http://somedomainthatwillneverexistforsure.com:8089', function (error) {
            expect(error).to.be.an(Error);
            expect(['ENOTFOUND', 'EADDRINFO']).to.contain(error.code);
            expect(error.replays).to.equal(5);
            next();
        }), {
            minTimeout: 10,
            maxTimeout: 10
        })
        .on('replay', function (replay) {
            expect(replay).to.be.an('object');
            expect(replay.number).to.equal(tries);
            expect(replay.error).to.be.an(Error);
            expect(['ENOTFOUND', 'EADDRINFO']).to.contain(replay.error.code);
            expect(replay.delay).to.be(10);
            tries++;
        });
    });

    it('should fire only one end event and no error events on success', function (next) {
        var tries = 0;
        var events = { error: 0, end: 0 };

        this.timeout(15000);

        replay(request.get('http://127.0.0.1:8089', { json: true }, function (error, response, body) {
            expect(error).to.be(null);
            expect(response).to.be.ok();
            expect(body).to.eql({ 'foo': 'bar' });

            expect(tries).to.be(1);
            expect(events).to.eql({ error: 0, end: 1 });
            next();
        }), {
            errorCodes: ['ECONNREFUSED'],
            minTimeout: 10,
            maxTimeout: 10
        })
        .on('error', function () {
            events.error += 1;
        })
        .on('end', function () {
            events.end += 1;
        })
        .on('replay', function () {
            tries++;

            server = http.createServer(function (req, res) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end('{ "foo": "bar" }');
            })
            .listen(8089, '127.0.0.1');
        });
    });
});
