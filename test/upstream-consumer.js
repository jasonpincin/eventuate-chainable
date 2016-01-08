var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('upstream consumer removed when chainable is destroyed', function (t) {
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
  ucEvent.consume(function () {})

  t.ok(event.hasConsumer(ucEvent.upstreamConsumer),
       'upstreamConsumer present before destroy')
  ucEvent.destroy()
  t.ok(!event.hasConsumer(ucEvent.upstreamConsumer),
       'upstreamConsumer NOT present after destroy')
})

test('upstream consumer not added if chainable destroyed', function (t) {
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

  t.ok(!event.hasConsumer(ucEvent.upstreamConsumer),
       'upstreamConsumer not present before destroy')
  ucEvent.destroy()
  ucEvent.consume(function () {})
  t.ok(!event.hasConsumer(ucEvent.upstreamConsumer),
       'upstreamConsumer not present when consuming after destroyed')
})
