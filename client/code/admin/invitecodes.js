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

      $body.on('submit', '#admin-invites form', function (event) {
        // Prevent the 'enter' key on some browsers from
        // submitting the form in the wrong way
        event.preventDefault()

        // Note that this still makes Davis add a '404' message at
        // the bottom for some reason...
      })

      $body.on('click', '#invite-button', function (event) {
        var $button = $(this)
        var $message = $('.server-response')
        var id = sessionStorage.getItem('userId')
        var instanceName = $('#invite-game-name').val().trim()
        var emailList = $('#invite-email-list').val().match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/gi)
        var emailListLength
        var newGameData

        // Cancel out if clicked but button is disabled
        if ($button.prop('disabled')) {
          return
        }

        // Reset the button and message state
        $button.removeClass('btn-success btn-error')
        $message.removeClass('error').text('')

        // Error for not providing a game name or email list
        if (!instanceName) {
          $button.addClass('btn-error')
          $message.addClass('error').text('Game name cannot be blank.')
          return false
        } else if (!emailList) {
          $button.addClass('btn-error')
          $message.addClass('error').text('Valid e-mail addresses are required.')
          return false
        }

        // Send invites
        emailList = emailList.slice(0, 20)
        emailListLength = emailList.length

        newGameData = {
          instanceName: instanceName,
          numPlayers: emailListLength,
          id: id
        }

        // Turn on the button spinner
        $button.find('.spinner').show()
        $button.prop('disabled', true)

        // Create the game instance
        ss.rpc('admin.invitecodes.newGameInstance', newGameData, function (err, res) {
          if (err) {
            var message = 'Cannot create this game: An error occured with the database. Please notify the administrator.'
            $message.addClass('error').text(message)
            $button.addClass('btn-error')
            console.log('error with db', err)
          } else if (res) {
            var message = 'Cannot create this game: Game name already exists.'
            $message.addClass('error').text(message)
            $button.addClass('btn-error')
          } else {
            // Send invites
            ss.rpc('admin.invitecodes.sendInvites', emailList, instanceName, function (res) {
              // On success, display a message...
              var message = 'Game has been created and invites have been sent!'
              $message.text(message)

              // ...and set the button in success state
              $button.addClass('btn-success')
            })
          }

          $button.find('.spinner').fadeOut(function () {
            $button.prop('disabled', false)
          })

        })

      })
    }

  }

}())
