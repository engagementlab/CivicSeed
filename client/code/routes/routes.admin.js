'use strict';

var self = module.exports = {

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
      $CONTAINER.addClass('admin-container')
      $('title').text('{ ::: Civic Seed - Admin Panel ::: }')
    })

    app.get('/admin/startup', function (req) {
      $CONTAINER.append(JT['admin-startup']({
        title: 'Startup',
        environment: CivicSeed.ENVIRONMENT,
        message: 'Startup admin panel.'
      }))
      $CONTAINER.addClass('admin-container')
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
          $CONTAINER.addClass('admin-container')
          $('title').text('{ ::: Civic Seed - Admin Panel - Monitor ::: }')
        }
      })
    })

    app.get('/admin/npcs', function (req) {
      ss.rpc('admin.npcs.init', sessionStorage.userId, function (result) {
        if (result) {
          //modify results for data output
          for (var r = 0; r < result.length; r++) {
            var x = result[r].index % 142
            var y = Math.floor(result[r].index / 142)
            result[r].x = x
            result[r].y = y
          }

          // Add a dummy template entry for new NPCs
          result.push({
            id:     '-template',
            newNpc: true,
            level:  0,
            x:      '',
            y:      '',
            name:   '',
            sprite: 0,
            index:  0,
            resource: {},
            dialog:  {
              prompts: [],
              smalltalk: []
            }
          })

          $CONTAINER.append(JT['admin-npcs']({
            title: 'NPC Control panel',
            environment: CivicSeed.ENVIRONMENT,
            npcs: result
          }))
          $CONTAINER.addClass('admin-container')

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
      $CONTAINER.addClass('admin-container')
      $('title').text('{ ::: Civic Seed - Admin Panel - Export ::: }')
    })

    app.get('/admin/export/:collection', function (req) {
      ss.rpc('admin.db.export', req.params['collection'], function (res) {
        if (res) {
          // TODO: This is hacky.
          // It should actually send a document of MIME type application/json
          // instead of just overwriting the HTML page.
          document.write(JSON.stringify(res))
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
      $CONTAINER.addClass('admin-container')
      $('title').text('{ ::: Civic Seed - Admin Panel - Invite Codes ::: }')
    })

  }

}
