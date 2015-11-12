var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('produced eventuate lazily consumes by default', function (t) {

    t.plan(2)

    var eventuateMap = chainable(function (eventuate, options, map) {
        return function upstreamConsumer (data) {
            eventuate.produce(map(data))
        }
    })

    var event = eventuate()
    var ucEvent = eventuateMap(event, function (data) { return data.toUpperCase() })

    t.ok(!event.hasConsumer(ucEvent.upstreamConsumer), 'does not immediately add consumer to upstream eventuate')
    ucEvent(function () {})
    t.ok(event.hasConsumer(ucEvent.upstreamConsumer), 'lazily adds consumer to upstream eventuate')
})

test('produced eventuate eagerly consumes with lazy = false', function (t) {

    t.plan(2)

    var eventuateMap = chainable(function (eventuate, options, map) {
        return function upstreamConsumer (data) {
            eventuate.produce(map(data))
        }
    })

    var event = eventuate()
    var ucEvent = eventuateMap(event, { lazy: false }, function (data) {
        t.pass('executed map')
        return data.toUpperCase()
    })

    t.ok(event.hasConsumer(ucEvent.upstreamConsumer), 'immediately adds consumer to upstream eventuate')
    event.produce('abc')
})
