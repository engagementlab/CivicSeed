'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    admin.profile

    - UI / controller for user-facing CMS for editing their own profile page.
    - TODO: Separate this out into a /code/profile collection of files.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $body

// S3Upload is a heavily modified version from this repository:  https://github.com/flyingsparx/s3upload-coffee-javascript
// This is because we need to use SocketStream to manage the communication with the back-end
// server rather than using a normal GET request, and the script is further simplified to assume
// only one file is getting uploaded at a time.
// More info:  https://devcenter.heroku.com/articles/s3-upload-node
var S3Uploader = function () {
}

S3Uploader.prototype.onFinishS3Put = function (public_url) {
  return console.log('S3Uploader.onFinishS3Put()', public_url)
}

S3Uploader.prototype.onProgress = function (percent, status) {
  return console.log('S3Uploader.onProgress()', percent, status)
}

S3Uploader.prototype.onError = function (status) {
  return console.log('S3Uploader.onError()', status)
}

S3Uploader.prototype.createCORSRequest = function (method, url) {
  var xhr
  xhr = new XMLHttpRequest()
  if (xhr.withCredentials != null) {
    xhr.open(method, url, true)
  } else if (typeof XDomainRequest !== "undefined") {
    xhr = new XDomainRequest()
    xhr.open(method, url)
  } else {
    xhr = null
  }
  return xhr
}

S3Uploader.prototype.uploadToS3 = function (file, url, public_url) {
  var this_s3upload, xhr
  this_s3upload = this
  xhr = this.createCORSRequest('PUT', url)
  if (!xhr) {
    this.onError('CORS not supported')
  } else {
    xhr.onload = function() {
      if (xhr.status === 200) {
        this_s3upload.onProgress(100, 'Upload completed.')
        return this_s3upload.onFinishS3Put(public_url)
      } else {
        console.log(xhr)
        return this_s3upload.onError('Upload error: ' + xhr.status)
      }
    }
    xhr.onerror = function() {
      return this_s3upload.onError('XHR error.')
    }
    xhr.upload.onprogress = function(e) {
      var percentLoaded
      if (e.lengthComputable) {
        percentLoaded = Math.round((e.loaded / e.total) * 100)
        return this_s3upload.onProgress(percentLoaded, percentLoaded === 100 ? 'Finalizing.' : 'Uploading.')
      }
    }
  }
  xhr.setRequestHeader('Content-Type', file.type)
  xhr.setRequestHeader('x-amz-acl', 'public-read')
  return xhr.send(file)
}

function showCurrentURIWithoutPrefix () {
  $('#copy-share-link-input').val(window.location.href.split('//')[1])
}

// TODO: Back end should reject invalid values too
function checkDesiredCustomProfileURL (input) {
  var check = input.toString().trim()

  // Check to make sure characters are legal
  var illegalChar = check.match(/[^A-Za-z0-9_-]+/)
  if (illegalChar && illegalChar.length > 0) {
    return 'Please only use letters, numbers, hyphens, and underscores.'
  }
  // Check string length is OK
  if (check.length < 4) {
    return 'Please enter more than four characters.'
  } else if (check.length > 32) {
    return 'Please enter no more than 32 characters.'
  }

  return true
}

// Share link box
function saveCustomProfileURL () {

  var desiredURL = $('#customize-share-link-input').val()

  var check = checkDesiredCustomProfileURL(desiredURL)
  // Check must explicitly equal true to continue, or it is an error message
  if (check !== true) {
    $('#share-link-message').text(check).addClass('color-red').show()
    return false
  }

  // 1. RPC call to backend with data
  // 2. Backend will attempt to make sure that the desiredURL is free
  // 3. If so, get the current player and update
  // 4. On error, apprise
  // 5. On success, return state of form with a "Success!" message.

  ss.rpc('profile.link.save', sessionStorage.getItem('userId'), desiredURL, function (res) {
    if (!res) {
      apprise('Error saving custom profile link.')
    } else {
      // Update location
      //Davis.history.assign(desiredURL)

      // Toggle visibility state of form
      $('#copy-share-link-group').show()
      $('#customize-share-link-group').hide()

      // Update the blanks
      showCurrentURIWithoutPrefix()

      // Success message
      $('#share-link-message').text('Your profile link has been changed successfully!').addClass('color-darkgreen').show()
    }
  })

}


module.exports = (function () {

  var uploadToS3 = function (file, signedRequest, mugshotURL, callback) {
    var s3upload = new S3Uploader({
      onProgress: function (percent, message) {
        console.log('Upload progress: ' + percent + '% ' + message)
        //status_elem.innerHTML = 'Upload progress: ' + percent + '% ' + message
      },
      onFinishS3Put: function (public_url) {
        console.log('Upload completed. Uploaded to: ' + public_url)
        //status_elem.innerHTML = 'Upload completed. Uploaded to: '+ public_url
        //url_elem.value = public_url
        //preview_elem.innerHTML = '<img src="'+public_url+'" style="width:300px">'
      },
      onError: function (status) {
        //status_elem.innerHTML = 'Upload error: ' + status
      }
    })
    s3upload.uploadToS3(file, signedRequest, mugshotURL)

    if (typeof callback === 'function') callback(signedRequest)
  }

  var saveMugshotURL = function (data) {
    console.log('saveMugshotURL called')
    ss.rpc('shared.profiles.updateProfileMugshotURL', sessionStorage.getItem('userId'), data)
  }

  return {
    init: function () {
      // Display share link
      showCurrentURIWithoutPrefix()

      // Set up all event listeners
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
        var profilePublic = $(this).attr('data-public')

        if (profilePublic === 'false' || !profilePublic) {
          profilePublic = true
        } else {
          profilePublic = false
        }

        // Save the change to user info
        var updateInfo = {
          id: sessionStorage.getItem('userId'),
          changeTo: profilePublic
        }
        ss.rpc('shared.profiles.setPublic', updateInfo, function (res) {

          if (!res) {
            apprise('Error')
          }

          // Update DOM
          // Catch all instances where the .profile-toggle element exists
          var $els = $('.profile-toggle')
          $els.attr('data-public', profilePublic)

          if (profilePublic) {
            $els.find('.profile-public').show()
            $els.find('.profile-private').hide()
            // Is this a good UX?
            //apprise('You have made your civic resume public! Share your page with your friends, colleagues and employers!')
          } else {
            $els.find('.profile-private').show()
            $els.find('.profile-public').hide()
            //apprise('You have made your civic resume private! Your share link will no longer be accessible to anyone else.')
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

        // Get a signed request to give the client temporary credentials to upload their file
        ss.rpc('profile.mugshot.signS3Request', sessionStorage.getItem('userId'), file, function (res) {
          uploadToS3(file, res.signedRequest, res.url, function () {

          })
        })
      })

      $body.on('click', '#copy-share-link-input', function () {
        $(this).select()
      })

      $body.on('click', '#customize-share-link-button', function () {
        var $el = $(this)

        // Toggle visibility state of form
        $('#copy-share-link-group').hide()
        $('#customize-share-link-group').css('display', 'table') // Restore display type to .input-group default

        // Fill in the blanks
        $('#share-link-prefix').text(window.location.href.split('profiles/')[0] + 'profiles/')
        $('#customize-share-link-input').val(window.location.href.split('profiles/')[1]).select()

      })

      $body.on('submit', '#share-link-form', function (e) {
        e.preventDefault()
        saveCustomProfileURL()
      })

      $body.on('click', '#save-share-link-button', function () {
        saveCustomProfileURL()
      })

      $body.on('keyup', '#customize-share-link-input', function () {
        // Reset
        $('#share-link-message').text('').removeClass('color-darkgreen color-red').hide()
      })

    }
  }

})()
