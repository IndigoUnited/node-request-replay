'use strict';

var retry = require('retry');
var deepExtend = require('deep-extend');

var errorCodes = [
    'EADDRINFO',
    'ETIMEDOUT',
    'ECONNRESET'
];

function requestReplay(request, options) {
    var originalEmit = request.emit;
    var operation;
    var attempts = 0;

    options = deepExtend({
        errorCodes: errorCodes,
        retries: 5,
        factor: 3,
        minTimeout: 2000,
        maxTimeout: 35000
    }, options || {});

    options.errorCodes = options.errorCodes || errorCodes;

    operation = retry.operation(options);
    operation.attempt(function () {
        if (attempts) {
            request.start();
        }

        attempts++;
    });

    request.emit = function (name, error) {
        // If not an error, pass-through
        if (name !== 'error') {
            return originalEmit.apply(this, arguments);
        }

        // If not a retry error code, pass-through
        if (options.errorCodes.indexOf(error.code) === -1) {
            return originalEmit.call(this, name, error);
        }

        // Retry
        if (operation.retry(error)) {
            return 0;
        }

        // No more retries available, error out
        error.replays = attempts - 1;
        return originalEmit.call(this, name, error);
    };

    return request;
}

module.exports = requestReplay;
