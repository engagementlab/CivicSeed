'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    admin.profile

    - UI / controller for user-facing CMS for editing their own profile page.

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

S3Uploader.prototype.createCORSRequest = function(method, url) {
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

        // Get a signed request to give the client temporary credentials to upload their file
        ss.rpc('profile.mugshot.signS3Request', sessionStorage.getItem('userId'), file, function (res) {
          uploadToS3(file, res.signedRequest, res.url, function () {

          })
        })
      })

      $(document).ready(function() {
        
      })

    }
  }

})()
