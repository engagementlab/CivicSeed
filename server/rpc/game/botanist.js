'use strict';

exports.actions = function (req, res, ss) {

  req.use('session')

  var BotanistModel = ss.service.useModel('botanist', 'ss')

  return {

    load: function () {
      BotanistModel.findOne(function (err, data) {
        res(data)
      })
    }

  }

}
