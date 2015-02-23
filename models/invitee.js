'use strict'

module.exports = {
  name: 'Invitee',
  collection: 'invitees',
  schema: {
    sessionName: String,
    email: String,
    accepted: Boolean,
    code: String
  }
}
