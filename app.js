var Promise  = require('es6-promise').Promise,
    Eateries = require('./eatery'),
    server   = require('./server');

var em = new Eateries();

console.log('Getting dining hall information...');
em.init().then(function (em_initialized) {
  console.log('Done.');
  // The eatery module object is initialized
  // Pass the object to the server module and start this party!
  server.start_server(em_initialized);
});