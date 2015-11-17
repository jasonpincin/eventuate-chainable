var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('errors are splittable', function (t) {
  t.plan(2)

  var eventuateMap = chainable(function (options, map) {
    return function upstreamConsumer (data) {
      this.error(new Error('boom'))
      this.error('boom')
      this.finish()
    }
  })

  var event = eventuate()
  eventuateMap(event, function (data) {
    return data.toUpperCase()
  }).consume(function (data) {
    t.ok(data instanceof Error, 'got an error')
  })
  event.produce('a')
})
