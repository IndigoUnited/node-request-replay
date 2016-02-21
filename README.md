# request-replay

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url]

[npm-url]:https://npmjs.org/package/request-replay
[downloads-image]:http://img.shields.io/npm/dm/request-replay.svg
[npm-image]:http://img.shields.io/npm/v/request-replay.svg
[travis-url]:https://travis-ci.org/IndigoUnited/node-request-replay
[travis-image]:http://img.shields.io/travis/IndigoUnited/node-request-replay/master.svg
[david-dm-url]:https://david-dm.org/IndigoUnited/node-request-replay
[david-dm-image]:https://img.shields.io/david/IndigoUnited/node-request-replay.svg
[david-dm-dev-url]:https://david-dm.org/IndigoUnited/node-request-replay#info=devDependencies
[david-dm-dev-image]:https://img.shields.io/david/dev/IndigoUnited/node-request-replay.svg

Replays a [request](https://github.com/mikeal/request) when a network error occurs using the [retry](https://github.com/felixge/node-retry) module.

**DO NOT** use this module if you are piping `request` instances.
If you are listening to `data` events to buffer, beware that you must reset everything when a `replay` occurs.
This is why `pipping` is not supported.


## Installation

`$ npm install request-replay`


## Usage

```js
var fs = require('fs');
var request = require('request');
var replay = require('request-replay');

// Note that the options argument is optional
// Accepts the same options the retry module does and an additional
// errorCodes array with error codes that cause the replay to happen
// Check out the code to see which is the default value for it
replay(request('http://google.com/doodle.png', { timeout: 10000 }, function (err, response, body) {
    // Do things
}), {
    retries: 10,
    factor: 3
})
.on('socket', function (socket) {
    // In some operating systems the socket timeout is 0 so you must explicitly set it
    // and close the socket once reached
    socket.setTimeout(10000, socket.end.bind(socket));
})
.on('replay', function (replay) {
    // "replay" is an object that contains some useful information
    console.log('request failed: ' + replay.error.code + ' ' + replay.error.message);
    console.log('replay nr: #' + replay.number);
    console.log('will retry in: ' + replay.delay + 'ms')
});
```

Note that the default retry options are modified to be more appropriate for requests:

* `retries`: The maximum amount of times to retry the operation. Default is `5`.
* `factor`: The exponential factor to use. Default is `2`.
* `minTimeout`: The amount of time before starting the first retry. Default is `2000`.
* `maxTimeout`: The maximum amount of time between two retries. Default is `35000`.
* `randomize`: Randomizes the timeouts by multiplying with a factor between `1` to `2`. Default is `true`.


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
