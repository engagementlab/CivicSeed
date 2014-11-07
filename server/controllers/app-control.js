'use strict';

var rootDir   = process.cwd(),
    CivicSeed = require(rootDir + '/app/CivicSeed').getGlobals(),
    ss        = require('socketstream')

var self = module.exports = {

  init: function (app) {

    ss.client.define('main', {
      view: 'main.jade',
      css: ['styles.styl'],
      code: [
        'libs/jquery.min.js',
        'libs/davis-0.9.6.min.js',
        'libs/underscore-min.js',
        'libs/backbone-min.js',
        'libs/bootstrap.min.js',
        'libs/d3.min.js',
        'libs/howler.min.js',
        'libs/plugins.js',
        'routes',
        'admin',
        'shared',
        'game',
        'main'
      ],
      tmpl: '*'
    })

    ss.http.route('/', function (req, res) {
      res.serveClient('main')
    })

    // 404'd
    // TODO: Verify if this is ever reached - I suspect it is not --LH
    app.use(function (req, res, next) {
      CivicSeed.SocketStream = false
      res.render(rootDir + '/client/views/main.jade', {
        title: '404 - Page Not Found',
        CivicSeed: JSON.stringify(CivicSeed),
        SocketStream: ''
      })
    })

  }

}
