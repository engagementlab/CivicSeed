'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    rpc.game.resource

    - Parses article Markdown and returns it to client as HTML.
    - Handle player's interaction with resource (saving, retrieving etc)

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var rootDir    = process.cwd(),
    fs         = require('fs'),
    Remarkable = require('remarkable'),
    winston    = require('winston')

exports.actions = function (req, res, ss) {

  req.use('session')

  // Set up Markdown parser
  var md = new Remarkable('full', {
    html:         true,        // Enable HTML tags in source
    xhtmlOut:     false,       // Use '/' to close single tags (<br />)
    breaks:       true,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-', // CSS language prefix for fenced blocks
    linkify:      true,        // autoconvert URL-like texts to links

    // Enable some language-neutral replacements + quotes beautification
    typographer:  true,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
    quotes: '“”‘’'
  })

  return {

    get: function (id) {
      var fileContents, errorMsg, html

      try {
        // Specify `encoding` option to return a string. Otherwise it returns a buffer.
        fileContents = fs.readFileSync(rootDir + '/data/articles/' + id + '.md', {
          encoding: 'utf8'
        })
      } catch (e) {
        errorMsg = 'Error reading resource article id ' + id + ': ' + e.code
        winston.error(errorMsg)
      }

      if (fileContents) {
        html = md.render(fileContents)

        // Parse <hr> as section breaks
        html = '<section>' + html.split('<hr>').join('</section><section>') + '</section>'

        // Respond to the client
        res(html)
      } else {
        res(errorMsg)
      }
    },

    setPlayerTagline: function (data) {

    }

  }
}
