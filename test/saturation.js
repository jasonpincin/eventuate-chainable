var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('supports saturation', function (t) {
  t.plan(4)

  var eventuateMap = chainable(function (options, map) {
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
      }, 100)
    }
  })

  var event        = eventuate()
  var eventMapped  = eventuateMap(event, { concurrency: 1 }, function (data) {
    return data.toUpperCase()
  })
  eventMapped.consume(function (data) {
    setImmediate(function () {
      t.ok(!event.isSaturated(), 'saturation clears for event')
      t.ok(!eventMapped.isSaturated(), 'saturation clears for eventMapped')
    })
  })
  event.produce('a')
  t.ok(event.isSaturated(), 'event becomes saturated')
  t.ok(eventMapped.isSaturated(), 'eventMapped becomes saturated')
})
