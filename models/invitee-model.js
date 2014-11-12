'use strict';

module.exports = function (db, Schema) {

  var InviteeSchema = new Schema({
    sessionName: String,
    email: String,
    accepted: Boolean,
    code: String
  })

  var InviteeModel = db.model('Invitee', InviteeSchema, 'invitees')

  return InviteeModel
}
