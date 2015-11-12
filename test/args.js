var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('chainable factory is passed eventuate, options, and all other args', function (t) {
    t.plan(10)

    var event = eventuate()
    chainable({ defaulted: 'hello' }, function (eventuate, options) {
        t.equal(arguments.length, 4)
        t.equal(arguments[2], 1)
        t.equal(arguments[3], 2)
        return upstreamConsumer
    })(event, 1, 2)

    chainable({ defaulted: 'hello', overridden: 'goodbye' }, function (eventuate, options) {
        t.equal(arguments.length, 3)
        t.equal(arguments[2], 'a')
        return upstreamConsumer
    })(event, { overridden: 'world' }, 'a')

    chainable(function (eventuate, options) {
        t.equal(arguments.length, 3)
        t.equal(typeof arguments[2], 'function')
        return upstreamConsumer
    })(event, { overridden: 'world' }, function () {})

    chainable(function (eventuate, options) {
        t.equal(arguments.length, 4)
        t.equal(typeof arguments[2], 'function')
        t.equal(arguments[3], 1)
        return upstreamConsumer
    })(event, function () {}, 1)

    function upstreamConsumer () {}
})
