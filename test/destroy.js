var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('should be destroyed with upstream', function (t) {
  t.plan(2)

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
    return function upstreamConsumer (data) {
      this.produce(map(data)).finish()
    }
  })

  var event = eventuate()
  var ucEvent = new EventuateMap(event, function (data) {
    return data.toUpperCase()
  })

  t.ok(!ucEvent.isDestroyed(), 'not destroyed initially')
  event.destroy()
  t.ok(ucEvent.isDestroyed(), 'destroyed after upstream is destroyed')
})

test('does not lazily consume after being destroyed', function (t) {
  t.plan(2)

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
    return function upstreamConsumer (data) {
      this.produce(map(data)).finish()
    }
  })

  var event = eventuate()
  var ucEvent = new EventuateMap(event, function (data) {
    return data.toUpperCase()
  })

  t.notOk(event.hasConsumer(ucEvent.upstreamConsumer),
          'consumer NOT in upstream')
  ucEvent.destroy()
  ucEvent.consume(function () {})
  t.notOk(event.hasConsumer(ucEvent.upstreamConsumer),
          'consumer NOT in upstream')
})
