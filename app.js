var request = require('request'),
    Promise = require('es6-promise').Promise,
    em = require('./eatery'),
    server = require('./server');

server.start_server();

// var d2c = new Date();
// 
// All the open halls
// em.are_open(d2c, true).then(console.log);
// 
// All the halls
// em.are_open(d2c, false).then(console.log);

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