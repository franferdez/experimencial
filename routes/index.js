module.exports = function (app) {
    app.get('/', index);
    app.get('/index', index);
    app.get('/video', video);
};

var index = function (req, res) {
    res.render('index', { title: 'Experimencial' });
};

var video = function (req, res) {
    res.render('video', { title: 'Experimencial' });
};

