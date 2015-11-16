var
  test          = require('tape'),
  eventuate     = require('eventuate-core'),
  chainable     = require('..'),
  FinishedError = require('../errors').FinishedError

test('cannot produce after finish', function (t) {
  t.plan(1)

  var eventuateMap = chainable(function (options, map) {
    return function upstreamConsumer (data) {
      var self = this
      this.produce(map(data)).finish()
      t.throws(function () {
        self.produce(map(data))
      }, FinishedError)
    }
  })

  var event = eventuate()
  eventuateMap(event, { lazy: false }, function (data) {
    return data.toUpperCase()
  })
  event.produce('a')
})
