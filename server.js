var http = require('http'),
    fs = require('fs'),
    url = require('url');

// Thanks to B T for the code for this web server code
// http://stackoverflow.com/a/26354478/1211985
var this_server;

/**
 * Starts an http server. Given the data object, matches the input paths to
 *   the object and outputs data based on that object
 * Requires: An object mapping paths to data
 */
module.exports.start_server = function(data) {
  this_server = http.createServer(function (req, res) {
    var request_parts = url.parse(req.url);
    var fs_path = request_parts.pathname;

    console.log('Received request:');
    console.log(request_parts);
    console.log();

    try {
        // All good!
        res.writeHead(200);
        res.write(data);
        res.end();
    } finally {
      // End the request so that the browser doesn't hang
      res.end();
    }
  });

  console.log('Listening on port 8080!');
  this_server.listen(8080);
}