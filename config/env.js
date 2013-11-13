var util = require(__dirname + '/../libs/util.js');

module.exports = function (express, app) {

    // Common configuration
    app.configure(function () {

        // Configure jQuery template engine
        express.version = require('express/package.json').version;
        app.set('views', __dirname + '/../views');
        app.set('view engine', 'jqtpl');
        app.set('layout', true);
        app.engine('jqtpl', require('jqtpl').__express);

        app.use(app.router);

        // Make sure build folders exist
        util.mkdir(__dirname + '/../build');
        util.mkdir(__dirname + '/../build/css');

        // Configure LESS compiler
        app.use('/css', require('less-middleware')({
            src: __dirname + '/../src/less',
            dest: __dirname + '/../build/css'
        }));

        // Create static file servers for the build and public folders
        app.use(express.static(__dirname + '/../build'));
        app.use(express.static(__dirname + '/../public'));

        app.use('/captures', express.static(__dirname + '/../captures'));


        /**
       * CanvasCapture is available as middleware so you can plug it right
       * into an existing server. The capture URLs can be namespaced by
       * specifying a prefix for the middleware (you will also have to specify
       * a prefix on the client-side too):
       *    app.use('/prefix', canvasCapture());
       *
       * The bodyParser middleware must be added before CanvasCapture.
       */
      app.use(express.bodyParser());

      var canvasCapture = require('../canvasCapture.server');
      app.use(canvasCapture());

    });



    // Development specific configuration
    app.configure('development', function () {
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
    });

    // Production specific configuration
    app.configure('production', function () {
        app.use(express.errorHandler());
    });

};