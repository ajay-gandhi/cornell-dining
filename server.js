/**
 * This module controls the server itself, including dynamic and static data.
 */

var http    = require('http'),
    fs      = require('fs'),
    url     = require('url'),
    qs      = require('querystring'),
    closest = require('./closest');

// Thanks to B T for contributing to this web server code
// http://stackoverflow.com/a/26354478/1211985
var this_server;

/**
 * Starts an http server. Given the data object, matches the input paths to
 *   the object and outputs data based on that object
 * Requires: An instance of the eatery module
 */
module.exports.start_server = function(eatery_object) {
  // Save the server as a local var so we do things with it later
  this_server = http.createServer(function (req, res) {
    // Get the requested path
    var request_parts = url.parse(req.url);
    var fs_path = request_parts.pathname;

    // Log some basic info
    console.log('Received request:');
    console.log(fs_path);
    console.log();

    // If path is root, set it to index
    fs_path = (fs_path == '/' || fs_path == '') ? '/index.html' : fs_path;

    // Check if the file exists in the html subdir
    fs.exists('html' + fs_path, function (exists) {
      if (exists) {
        // The file exists on the server, so serve it up
        res.writeHead(200);
        fs.readFile('html' + fs_path, function (err, file) {
          if (err) {
            console.log(err);
            res.end();
          }

          res.write(file);
          res.end();
        });

      } else if (fs_path == '/open') {
        // This is the AJAX request for which halls are open
        // Using the eatery module, find out which ones are open given the time

        // First get the time in ms from the query and convert it to a date obj
        var local_ms = qs.parse(request_parts.query).localTime;
        var local_time = new Date(parseInt(local_ms));

        // // Pass it to the eatery module to get which places are open
        eatery_object.are_open(local_time, true)
          .then(function (results) {
            res.writeHead(200);
            res.write(JSON.stringify(results));
            res.end();
          })
          .catch(console.error);

      } else if (fs_path == '/closest') {
        // Requesting the closest dining hall
        var args = qs.parse(request_parts.query);
        var evt_data = args.events;
        var ll = [args.lat, args.lng];

        // Ask the Closest module which place is closest
        closest.closest(JSON.parse(evt_data), ll)
          .then(function (c) {
            // Received a result, send it back to the client
            res.writeHead(200);
            res.write(JSON.stringify(c));
            res.end();
          })
          .catch(console.error);

      } else {
        // File doesn't exist and request is not a query for eatery info
        // So redirect to index page
        res.writeHead(302, {
          'Location': '/index.html'
        });
        res.end();
      }
    });
  });

  console.log('Listening on port 8080.');
  this_server.listen(8080);
}