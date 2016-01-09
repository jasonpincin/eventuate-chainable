var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('residual chainable eventuate destroyed by default', function (t) {
  t.plan(1)

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
  ucEvent.removeAllConsumers()

  t.ok(ucEvent.isDestroyed(), 'destroyed after last consumer removed')
})

test('residual not destroyed if destroyResidual = false', function (t) {
  t.plan(1)

  var EventuateMap = chainable(eventuate, {
    destroyResidual: false
  }, function (options, map) {
    return function upstreamConsumer (data) {
      this.produce(map(data)).finish()
    }
  })

  var event = eventuate()
  var ucEvent = new EventuateMap(event, function (data) {
    return data.toUpperCase()
  })
  ucEvent.consume(function () {})
  ucEvent.removeAllConsumers()

  t.ok(!ucEvent.isDestroyed(), 'not destroyed after last consumer removed')
})
