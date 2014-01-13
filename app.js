var express = require('express'),
    http = require('http'),
    path = require('path'),
    app = express(),
    opts = require(__dirname + '/config/opts.js');

// Load express configuration
require(__dirname + '/config/env.js')(express, app);

// Load routes
require(__dirname + '/routes')(app);

// Start the server
http.createServer(app).listen(process.env.PORT || opts.port, function () {
    console.log("Express server listening on port %d in %s mode", process.env.PORT || opts.port, app.settings.env);
});
