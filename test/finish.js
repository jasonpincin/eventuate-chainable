var test          = require('tape'),
    eventuate     = require('eventuate-core'),
    chainable     = require('..'),
    FinishedError = require('../errors').FinishedError

test('cannot produce after finish', function (t) {
  t.plan(2)

  var EventuateMap = chainable(eventuate, function (options, map) {
    return function upstreamConsumer (data) {
      var self = this
      this.produce(map(data)).finish()
      t.throws(function () {
        self.produce(map(data))
      }, FinishedError)
      t.throws(function () {
        self.produceError(new Error('boom'))
      }, FinishedError)
    }
  })

  var event = eventuate()
  event.upper = new EventuateMap(event, { lazy: false }, function (data) {
    return data.toUpperCase()
  })
  event.produce('a')
})
