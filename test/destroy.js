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
