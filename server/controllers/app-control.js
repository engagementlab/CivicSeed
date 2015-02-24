'use strict'

var ss = require('socketstream')

module.exports = {

  init: function (app) {
    ss.client.define('main', {
      view: 'main.jade',
      css: ['styles.styl'],
      code: [
        'system',
        'libs/jquery.min.js',
        'libs/davis.min.js',
        'libs/bootstrap.min.js',
        'libs/d3.min.js',
        'libs/apprise.js',
        'libs/howler.min.js',
        'routes',
        'data',
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
  }

}
