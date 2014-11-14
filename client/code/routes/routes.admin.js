var self = module.exports = {

  loadRoutes: function ($app) {

    require('/admin').init()
    var npcs = require('/npcs')
    npcs.init()

    $app.get('/admin', function (req) {
      $CONTAINER.append(JT['admin-panel']({
        environment: CivicSeed.ENVIRONMENT,
        message: 'User admin panel.'
      }))
      $CONTAINER.addClass('admin-container')
      $('title').text('{ ::: Civic Seed - Admin Panel ::: }')
    })

    $app.get('/admin/startup', function (req) {
      $CONTAINER.append(JT['admin-startup']({
        title: 'Startup',
        environment: CivicSeed.ENVIRONMENT,
        message: 'Startup admin panel.'
      }))
      $CONTAINER.addClass('admin-container')
      $('title').text('{ ::: Civic Seed - Admin Panel - Startup ::: }')
    })

    $app.get('/admin/monitor', function (req) {
      ss.rpc('admin.monitor.getInstanceNames', sessionStorage.userId, function (err, info) {
        if (err) {
          apprise(err)
        } else {
          $CONTAINER.append(JT['admin-monitor']({
            environment: CivicSeed.ENVIRONMENT,
            instances: info
          }))
          $CONTAINER.addClass('admin-container')
          $('title').text('{ ::: Civic Seed - Admin Panel - Monitor ::: }')
        }
      })
    })

    $app.get('/admin/npcs', function (req) {
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

    $app.get('/admin/npcs/export', function (req) {
      ss.rpc('admin.db.export', 'Npc', function (res) {
        if (res) {
          // TODO: This is hacky.
          // It should actually send a document of MIME type application/json
          // instead of just overwriting the HTML page.
          document.write(JSON.stringify(res))
        } else {
          console.log('Error exporting NPC data.')
        }
      })
    })

    $app.get('/admin/invitecodes', function (req) {
      $CONTAINER.append(JT['admin-invitecodes']({
        title: 'Startup',
        environment: CivicSeed.ENVIRONMENT,
        message: 'Startup admin panel.'
      }))
      $CONTAINER.addClass('admin-container')
      $('title').text('{ ::: Civic Seed - Admin Panel - Invite Codes ::: }')
    })

  }

}
