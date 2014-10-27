var request = require('request'),
    Promise = require('es6-promise').Promise,
    em      = require('./eatery'),
    server  = require('./server');

var d2c = new Date('2014-10-26T20:00:00.000Z');

// All the open halls
console.log('Getting dining hall information...');
em.are_open(d2c, true).then(function (which_open) {

  // Everything is ready, start the server
  server.start_server({
    which_open: which_open
  });
  console.log('Server running on port 8080!');
});