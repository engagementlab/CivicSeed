'use strict'

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    rpc.profile.mugshot

    - Handles upload, processing, and retrieval of user mugshot images.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var rootDir = process.cwd() || '.'
var config = require(rootDir + '/app/config')
var miscUtils = require(rootDir + '/server/utils/misc')
var aws = require('aws-sdk')
var winston = require('winston')

exports.actions = function (req, res, ss) {
  req.use('session')
  req.use('account.authenticated')

  return {

    signS3Request: function (playerId, file) {
      winston.info('Request to upload a profile image:', playerId, file.name, file.type, file.size)

      var NODE_ENV = config.get('NODE_ENV')
      var S3_BUCKET = config.get('MUGSHOTS_S3_BUCKET')
      var S3_PATH_NAME = 'mugshots/'

      // If !production env, append the env name as a path (facilitates cleaning)
      if (config.get('NODE_ENV') !== 'production') {
        S3_PATH_NAME += NODE_ENV + '/'
      }

      aws.config.update({
        accessKeyId: config.get('AWS_ACCESS_KEY'),
        secretAccessKey: config.get('AWS_SECRET_KEY')
      })

      var FILE_PATH = S3_PATH_NAME + playerId + '.' + miscUtils.getFilenameExtension(file.name)

      var s3 = new aws.S3()
      var s3_params = {
        Bucket: S3_BUCKET,
        Key: FILE_PATH,
        ContentType: file.type,
        Expires: 60,
        ACL: 'public-read'
      }

      s3.getSignedUrl('putObject', s3_params, function (err, data) {
        if (err) {
          console.log(err)
        } else {
          var response = {
            signedRequest: data,
            url: 'https://s3.amazonaws.com/' + S3_BUCKET + '/' + FILE_PATH
          }
          res(response)
        }
      })
    }

  }
}
