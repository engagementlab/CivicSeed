'use strict'

module.exports = {
  name: 'Chat',
  collection: 'chat',
  schema: {
    id: String,
    who: String,
    what: String,
    when: Date,
    instanceName: String
  }
}
