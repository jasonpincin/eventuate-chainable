var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('requires an eventuate', function (t) {
  t.plan(1)
  t.throws(function () {
    chainable(function () {})({ /* not an eventuate */ })
  })
})

test('chainable factory is passed options, and all other args', function (t) {
  t.plan(10)

  var event = eventuate()
  chainable({ defaulted: 'hello' }, function (options) {
    t.equal(arguments.length, 3)
    t.equal(arguments[1], 1)
    t.equal(arguments[2], 2)
    return upstreamConsumer
  })(event, 1, 2)

  chainable({ defaulted: 'hello', overridden: 'goodbye' }, function (options) {
    t.equal(arguments.length, 2)
    t.equal(arguments[1], 'a')
    return upstreamConsumer
  })(event, { overridden: 'world' }, 'a')

  chainable(function (options) {
    t.equal(arguments.length, 2)
    t.equal(typeof arguments[1], 'function')
    return upstreamConsumer
  })(event, { overridden: 'world' }, function () {})

  chainable(function (options) {
    t.equal(arguments.length, 3)
    t.equal(typeof arguments[1], 'function')
    t.equal(arguments[2], 1)
    return upstreamConsumer
  })(event, function () {}, 1)

  function upstreamConsumer () {}
})
