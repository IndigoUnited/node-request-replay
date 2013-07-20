'use strict';

var request = require('request');
var expect = require('expect.js');
var replay = require('../');

describe('request-replay', function () {
    it('should replay on network error', function (next) {
        var error;

        error = new Error('foo');
        error.code = 'ECONNRESET';

        replay(request.get('http://somedomainthatwillneverexistforsure.com:8089', function (error) {
            expect(error).to.be.an(Error);
            expect(error.code).to.equal('ENOTFOUND');
            expect(error.replays).to.equal(5);
            next();
        }), { errorCodes: ['ENOTFOUND'], factor: 1, minTimeout: 10, maxTimeout: 10 });
    });

    it('should fire a replay event on each retry', function (next) {
        var stream;
        var error;
        var tries = 0;

        error = new Error('foo');
        error.code = 'ECONNRESET';

        stream = replay(request.get('http://somedomainthatwillneverexistforsure.com:8089', function (error) {
            expect(error).to.be.an(Error);
            expect(error.code).to.equal('ENOTFOUND');
            expect(error.replays).to.equal(5);
            next();
        }), { errorCodes: ['ENOTFOUND'], factor: 1, minTimeout: 10, maxTimeout: 10 })
        .on('replay', function (nr, error) {
            expect(nr).to.equal(tries);
            expect(error).to.be.an(Error);
            expect(error.code).to.equal('ENOTFOUND');
            tries++;
        });
    });
});
