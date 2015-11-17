var test           = require('tape'),
    basicEventuate = require('eventuate-core/basic'),
    chainable      = require('..')

test('basic eventuates not supported', function (t) {
  t.plan(1)

  var event = basicEventuate()
  var chain = chainable(function (options) {
    return upstreamConsumer
  })
  t.throws(function () {
    chain(event)
  }, TypeError, 'throws a type error')

  function upstreamConsumer () {}
})
