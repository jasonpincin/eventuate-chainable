var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('supports saturation', function (t) {
  t.plan(4)

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
      }, 100)
    }
  })

  var event        = eventuate()
  var eventMapped  = new EventuateMap(event, {
    concurrency: 1
  }, function (data) {
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

test('saturation prior to upstream consumption ok', function (t) {
  t.plan(1)

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
      }, 100)
    }
  })

  var event        = eventuate()
  var eventMapped  = new EventuateMap(event, {
    concurrency: 1
  }, function (data) {
    return data.toUpperCase()
  })

  t.doesNotThrow(function () {
    eventMapped._setSaturated()
  }, 'does not throw')
})

test('respects consumer saturation', function (t) {
  t.plan(2)

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
    return function upstreamConsumer (data) {
      this.produce(map(data)).finish()
    }
  })

  var event        = eventuate()
  var eventMapped  = new EventuateMap(event, {
    concurrency: 1
  }, function (data) {
    return data.toUpperCase()
  })
  eventMapped.on('saturated', function () {
    t.pass('got saturated event')
  })
  eventMapped.on('unsaturated', function () {
    t.pass('got unsaturated event')
  })
  var consumption = eventMapped.consume(consumer)
  consumption.saturated()
  consumption.unsaturated()

  function consumer () {}
})

test('unsaturated consumer ignored when locally saturated', function (t) {
  t.plan(3)

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
      }, 50)
    }
  })

  var saturated   = false
  var event       = eventuate()
  var eventMapped = new EventuateMap(event, {
    lazy       : false,
    concurrency: 1
  }, function (data) {
    return data.toUpperCase()
  })
  eventMapped.on('saturated', function () {
    saturated = true
  })
  eventMapped.on('unsaturated', function () {
    saturated = false
  })
  event.produce('a')
  t.ok(saturated, 'consumption saturated after production a')
  event.produce('b')
  event.produce('c')
  event.produce('d')
  t.ok(saturated, 'consumption saturated after production b')

  var consumption = eventMapped.consume(consumer)
  consumption.saturated()
  consumption.unsaturated()
  t.ok(saturated, 'consumption remains saturated after consumer unsaturated')

  function consumer () {}
})
