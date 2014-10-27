var request = require('request'),
    Promise = require('es6-promise').Promise,
    em = require('./eatery'),
    server = require('./server');

var d2c = new Date('2014-10-26T20:00:00.000Z');

var e_location,
    e_building,
    e_type;

// All the open halls
console.log('Getting dining hall information...');
em.are_open(d2c, true).then(function (which_open) {

  // Everything is ready, start the server
  server.start_server({
    which_open: which_open
  });
  console.log('Server running on port 8080!');
});

/**
 * Given a string containing underscores rather than spaces, such as
 *   'hello_world' replaces the underscore with a space and capitalizes the
 *   first letter of each word.
 * Requires: A symbol-delimited string
 * Returns: A display-able version of the input string.
 */
var prettify_name = function(e_name) {
  return e_name[0].toUpperCase()
    + e_name.substr(1).replace(/_([a-z])/ig, function(all, letter) {
    return ' ' + letter.toUpperCase();
  });
}