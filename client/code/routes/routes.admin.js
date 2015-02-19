'use strict'
/* global CivicSeed, $, ss, $CONTAINER, JT, apprise */

var _ = require('underscore')

module.exports = {

  loadRoutes: function (app) {
    require('/admin').init()
    require('/export').init()
    require('/invitecodes').init()

    var npcs = require('/npcs')
    npcs.init()

    app.get('/admin', function (req) {
      $CONTAINER.append(JT['admin-panel']({
        id: 'admin',
        title: 'Site administration',
        environment: CivicSeed.ENVIRONMENT,
        message: 'User admin panel.'
      }))
      $('title').text('{ ::: Civic Seed - Admin Panel ::: }')
    })

    app.get('/admin/startup', function (req) {
      $CONTAINER.append(JT['admin-startup']({
        title: 'Startup',
        environment: CivicSeed.ENVIRONMENT,
        message: 'Startup admin panel.'
      }))
      $('title').text('{ ::: Civic Seed - Admin Panel - Startup ::: }')
    })

    app.get('/admin/monitor', function (req) {
      ss.rpc('admin.monitor.getInstanceNames', sessionStorage.userId, function (err, info) {
        if (err) {
          apprise(err)
        } else {
          $CONTAINER.append(JT['admin-monitor']({
            title: 'Monitor',
            environment: CivicSeed.ENVIRONMENT,
            instances: info
          }))
          $('title').text('{ ::: Civic Seed - Admin Panel - Monitor ::: }')
        }
      })
    })

    app.get('/admin/npcs', function (req) {
      ss.rpc('admin.npcs.init', sessionStorage.userId, function (result) {
        if (result) {
          // Add a dummy template entry for new NPCs
          result.push({
            id: '-template',
            newNpc: true,
            level: 0,
            position: {
              x: '',
              y: ''
            },
            name: '',
            sprite: 0,
            index: 0,
            resource: {},
            dialog: {
              prompts: [],
              smalltalk: []
            }
          })

          $CONTAINER.append(JT['admin-npcs']({
            title: 'NPC Control panel',
            environment: CivicSeed.ENVIRONMENT,
            npcs: result
          }))

          $('title').text('{ ::: Civic Seed - Admin Panel - NPCs ::: }')

          npcs.addSprites()
        } else {
          console.log('error')
        }
      })
    })

    app.get('/admin/export', function (req) {
      $CONTAINER.append(JT['admin-export']({
        title: 'Export data',
        environment: CivicSeed.ENVIRONMENT,
        message: 'Export database information.'
      }))
      $('title').text('{ ::: Civic Seed - Admin Panel - Export ::: }')
    })

    app.get('/admin/export/:collection', function (req) {
      ss.rpc('admin.db.export', req.params['collection'], function (res) {
        if (res) {
          // TODO: This is hacky.
          // It should actually send a document of MIME type application/json
          // instead of just overwriting the HTML page.
          // Sort response by 'id' if that property is present
          document.write(JSON.stringify(_.sortBy(res, 'id')))
        } else {
          document.write('Error exporting data.')
        }
      })
    })

    app.get('/admin/invitecodes', function (req) {
      $CONTAINER.append(JT['admin-invitecodes']({
        title: 'Create new game',
        environment: CivicSeed.ENVIRONMENT,
        message: 'Send invite codes.'
      }))
      $('title').text('{ ::: Civic Seed - Admin Panel - Invite Codes ::: }')
    })
  }

}
