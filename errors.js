var defineError = require('define-error')

module.exports = {
  FinishedError: defineError('FinishedError', assignData)
}

function assignData (_, data) {
  this.data = data
}
