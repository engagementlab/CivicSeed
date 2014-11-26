'use strict';

var $body

module.exports = {

  init: function () {

    $body = $(document.body)

    $body.on('click', '.save-profile-button', function () {
      var updates = [],
          info = $('.resume-text-editable')

      $.each(info, function (i, text) {
        var val = $(text).text()
        updates.push(val)
      })
      var updateInfo = {
        id: sessionStorage.getItem('userId'),
        resume: updates
      }
      ss.rpc('shared.profiles.updateResume', updateInfo, function (res) {
        if (res) {
          apprise('Changes saved.')
        }
      })
    })

    $body.on('click', '.profile-toggle', function () {
      var $el = $(this),
          profilePublic = $(this).attr('data-public'),
          changeTo,
          newText,
          newClass

      if (profilePublic === 'false' || !profilePublic) {
        profilePublic = 'true'
        changeTo = true
        newText = 'your profile is public'
        newClass = 'fa fa-unlock-alt fa-4x'
      } else {
        profilePublic = 'false'
        changeTo = false
        newText = 'your profile is private'
        newClass = 'fa fa-lock fa-4x'
      }

      // Save the change to user info
      var updateInfo = {
        id: sessionStorage.getItem('userId'),
        changeTo: changeTo
      }
      ss.rpc('shared.profiles.setPublic', updateInfo, function (res) {

        if (!res) {
          apprise('Error')
        }

        // Update dom
        $el.attr('data-public', profilePublic)
        $el.find('.profile-toggle-text').text(newText)
        $el.find('i').removeClass().addClass(newClass)

        if (changeTo) {
          apprise('You have made your civic resume public! Share your page with your friends, colleagues and employers!')
        }

      })
    })

    $body.on('click', '.feedback button', function () {
      var row = $(this).parent().find('.row')
      $(row).toggle()
    })

    $body.on('change', '#mugshot-uploader', function () {
      var file = this.files[0]
      var fileContents = ''
      ss.rpc('shared.profiles.signS3Request', sessionStorage.getItem('userId'), file, function (res) {
        apprise(res)
      })
    })

    $(document).ready(function() {
      
    })

  }
}
