/**
 * This module controls the server itself, including dynamic and static data.
 */

var express = require('express'),
    closest = require('./closest'),
    Menu    = require('./menu');

var app = express();

var menu;

/**
 * Starts an http server.
 * Requires: [Module] An instance of the eatery module
 */
module.exports.start_server = function(eatery_object) {
  var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
  var server_ip_address = process.env.OPENSHIFT_NODEJS_IP;

  menu = new Menu(server_ip_address);

  // Serve up static files from html subdir if requested
  app.use(express.static(__dirname + '/html'));

  app.get('/open', function (req, res) {
    // This is the AJAX request for which halls are open
    // Using the eatery module, find out which ones are open given the time

    // First get the time in ms from the query, adjust for the timezone offset,
    // and convert it to a date obj
    var local_ms = parseInt(req.query.localTime);

    // Pass it to the eatery module to get which places are open
    eatery_object.are_open(local_ms, true)
      .then(function (results) {
        res.send(JSON.stringify(results));
      })
      .catch(console.error);
  });

  app.get('/closest', function (req, res) {
    // Requesting the closest dining hall

    // Parse the data into event data and user latlong
    var evt_data = JSON.parse(req.query.events);
    var ll = [req.query.lat, req.query.lng];

    // Ask the Closest module which place is closest
    closest.closest(evt_data, ll)
      .then(function (c) {
        // Received a result, send it back to the client
        res.send(JSON.stringify(c));
      })
      .catch(console.error);
  });

  app.get('/menu', function (req, res) {
    // Requesting the menu

    // Get the hall and meal
    var hall = req.query.hall;
    var time = req.query.time;

    console.log('going to get menu');
    menu.get_menu(time, hall)
      .then(function (menu) {
        console.log('got menu');
        res.send(JSON.stringify(menu));
      });
  });

  // Actually start the server
  app.listen(server_port, server_ip_address, function() {
    console.log('Server running on port ' + server_port);
  });
}
