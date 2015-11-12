var test               = require('tape'),
    eventuate          = require('eventuate-core'),
    eventuateChainable = require('..')

test('should create a mapper', function (t) {
    t.plan(1)

    var eventuateMap = eventuateChainable(function (eventuate, options, map) {
        return function upstreamConsumer (data) {
            eventuate.produce(map(data))
        }
    })

    var event = eventuate()
    var ucEvent = eventuateMap(event, function (data) {
        return data.toUpperCase()
    })

    ucEvent(function (data) {
        t.equal(data, 'HI')
    })

    event.produce('hi')
})
