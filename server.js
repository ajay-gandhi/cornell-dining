var http = require('http'),
    fs   = require('fs'),
    url  = require('url');

// Thanks to B T for contributing to this web server code
// http://stackoverflow.com/a/26354478/1211985
var this_server;

/**
 * Starts an http server. Given the data object, matches the input paths to
 *   the object and outputs data based on that object
 * Requires: An object mapping paths to data
 */
module.exports.start_server = function(data) {
  // Save the server as a local var so we can edit it later
  this_server = http.createServer(function (req, res) {
    // Get the requested path
    var request_parts = url.parse(req.url);
    var fs_path = request_parts.pathname;

    console.log('Received request:');
    console.log(request_parts);
    console.log();

    // If path is root, set it to index
    fs_path = (fs_path == '/' || fs_path == '') ? '/index.html' : fs_path;

    // 
    fs.exists('html' + fs_path, function (exists) {
      if (exists) {
        // The file exists on the server, so serve it up
        res.writeHead(200);
        fs.readFile('html' + fs_path, 'utf8', function (err, file) {
          if (err) {        
            console.log(err);
            res.end();
          }

          res.write(file, 'utf8');
          res.end();
        });
      } else {
        // File doesn't exist, redirect to index page
        res.writeHead(302, {
          'Location': '/index.html'
        });
        res.end();
      }
    });
  });

  console.log('Listening on port 8080!');
  this_server.listen(8080);
}