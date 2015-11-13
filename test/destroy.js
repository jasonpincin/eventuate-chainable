var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('should be destroyed with upstream', function (t) {
    t.plan(2)

    var eventuateMap = chainable(function (eventuate, options, map) {
        return function upstreamConsumer (data) {
            eventuate.produce(map(data))
        }
    })

    var event = eventuate()
    var ucEvent = eventuateMap(event, function (data) { return data.toUpperCase() })

    t.ok(!ucEvent.isDestroyed(), 'not destroyed initially')
    event.destroy()
    t.ok(ucEvent.isDestroyed(), 'destroyed after upstream is destroyed')
})

test('does not lazily consume after being destroyed', function (t) {
    t.plan(2)

    var eventuateMap = chainable(function (eventuate, options, map) {
        return function upstreamConsumer (data) {
            eventuate.produce(map(data))
        }
    })

    var event = eventuate()
    var ucEvent = eventuateMap(event, function (data) { return data.toUpperCase() })

    t.notOk(event.hasConsumer(ucEvent.upstreamConsumer), 'consumer NOT in upstream')
    ucEvent.destroy()
    ucEvent(function () {})
    t.notOk(event.hasConsumer(ucEvent.upstreamConsumer), 'consumer NOT in upstream')
})

test('should remove upstream destroy handler', function (t) {
    t.plan(2)

    var eventuateMap = chainable(function (eventuate, options, map) {
        return function upstreamConsumer (data) {
            eventuate.produce(map(data))
        }
    })

    var event = eventuate()
    var ucEvent = eventuateMap(event, function (data) { return data.toUpperCase() })

    t.ok(event.destroyed.hasConsumer())
    ucEvent.destroy()
    t.ok(!event.destroyed.hasConsumer())
})
