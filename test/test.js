'use strict';

var request = require('request');
var expect = require('expect.js');
var replay = require('../');

describe('request-replay', function () {
    it('should retry on network error', function (next) {
        var stream;
        var error;

        error = new Error('foo');
        error.code = 'ECONNRESET';

        stream = replay(request.get('http://somedomainthatwillneverexistforsure.com:8089', function (error) {
            expect(error).to.be.an(Error);
            expect(error.code).to.equal('ENOTFOUND');
            expect(error.replays).to.equal(5);
            next();
        }), { errorCodes: ['ENOTFOUND'], factor: 1, minTimeout: 10, maxTimeout: 10 });
    });
});
