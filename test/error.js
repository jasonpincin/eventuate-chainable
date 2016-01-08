var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('errors are splittable', function (t) {
  t.plan(1)

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
    return function upstreamConsumer (data) {
      this.produceError(new Error('boom')).finish()
    }
  })

  var event = eventuate()
  new EventuateMap(event, function (data) {
    return data.toUpperCase()
  }).consume(function () {}, function (err) {
    t.ok(err instanceof Error, 'got an error')
  })
  event.produce('a')
})
