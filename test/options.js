var test                     = require('tape'),
    eventuate                = require('eventuate-core'),
    chainable                = require('..')

test('factories accept default and create options', function (t) {
    t.plan(12)

    var event = eventuate()
    chainable({ defaulted: 'hello' }, function (eventuate, options) {
        t.equal(options.defaulted, 'hello')
        t.equal(options.lazy, true)
        t.equal(options.destroyResidual, true)
        return upstreamConsumer
    })(event)

    chainable({ defaulted: 'hello', overridden: 'goodbye' }, function (eventuate, options) {
        t.equal(options.defaulted, 'hello')
        t.equal(options.overridden, 'world')
        t.equal(options.lazy, true)
        t.equal(options.destroyResidual, true)
        return upstreamConsumer
    })(event, { overridden: 'world' })

    chainable(function (eventuate, options) {
        t.equal(options.overridden, 'world')
        t.equal(options.lazy, true)
        t.equal(options.destroyResidual, true)
        return upstreamConsumer
    })(event, { overridden: 'world' })

    chainable(function (eventuate, options) {
        t.equal(options.lazy, true)
        t.equal(options.destroyResidual, true)
        return upstreamConsumer
    })(event)

    function upstreamConsumer () {}
})
