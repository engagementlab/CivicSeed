'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    client/code/admin/invitecodes.js

    - Client side administration code for sending invites to new games

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var self = module.exports = (function () {

  var $body

  return {

    init: function () {
      $body = $(document.body)
      self.setupInviteCodes()
    },

    // Create event listeners to export data
    setupInviteCodes: function () {

      $body.on('click', '#invite-button', function (event) {
        var button = $(this)
        button.removeClass('btn-success')

        var emailList = $('#invite-email-list').val().match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/gi)
        var instanceName = $('#invite-game-name').val().trim()
        var emailListLength

        if (instanceName && emailList) {
          emailList = emailList.slice(0, 20)
          emailListLength = emailList.length
          var id = sessionStorage.getItem('userId')
          ss.rpc('admin.invitecodes.newGameInstance', {instanceName: instanceName, numPlayers: emailListLength, id: id}, function (err, res) {
            if (err) {
              console.log('error with db', err)
            } else if (res) {
              apprise('Cannot create this game: game name already exists.')
            } else {
              ss.rpc('admin.invitecodes.sendInvites', emailList, instanceName, function (res) {
                button.addClass('btn-success')
              })
            }
          })
        }

      })
    }

  }

}())
