var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('residual chainable eventuate destroyed by default', function (t) {
    t.plan(1)

    var eventuateMap = chainable(function (eventuate, options, map) {
        return function upstreamConsumer (data) {
            eventuate.produce(map(data))
        }
    })

    var event = eventuate()
    var ucEvent = eventuateMap(event, function (data) { return data.toUpperCase() }).consume(function () {})
    ucEvent.removeAllConsumers()

    t.ok(ucEvent.isDestroyed(), 'destroyed after last consumer removed')
})

test('residual chainable eventuate not destroyed is destroyResidual = false', function (t) {
    t.plan(1)

    var eventuateMap = chainable({ destroyResidual: false }, function (eventuate, options, map) {
        return function upstreamConsumer (data) {
            eventuate.produce(map(data))
        }
    })

    var event = eventuate()
    var ucEvent = eventuateMap(event, function (data) { return data.toUpperCase() }).consume(function () {})
    ucEvent.removeAllConsumers()

    t.ok(!ucEvent.isDestroyed(), 'not destroyed after last consumer removed')
})
