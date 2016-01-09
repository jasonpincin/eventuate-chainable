var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('upstream consumer removed when chainable is destroyed', function (t) {
  t.plan(2)

  var EventuateMap = chainable(eventuate, function (options, map) {
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

  var EventuateMap = chainable(eventuate, function (options, map) {
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

test('chainable destroyed soon when upstream consumer removed', function (t) {
  t.plan(1)

  var timeouts = [10, 20, 50, 100, 30, 15, 25]

  var EventuateMap = chainable(eventuate, function (options, map) {
    var idx = 0
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
      }, timeouts[idx++])
    }
  })

  var event  = eventuate(),
      result = []

  var ucEvent = new EventuateMap(event, { order: true }, function (data) {
    return data.toUpperCase()
  })
  ucEvent.consume(function (l) {
    result.push(l)
  })

  event.produce('a')
  event.produce('b')
  event.produce('c')
  event.produce('d')
  event.produce('e')
  event.produce('f')
  event.produce('g')
  event.removeAllConsumers()

  ucEvent.on('destroy', function () {
    t.deepEqual(result, ['A', 'B', 'C', 'D', 'E', 'F', 'G'])
  })
})
