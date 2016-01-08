/*eslint no-new:0*/
var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('factories accept default and create options', function (t) {
  t.plan(12)

  var event = eventuate()
  new (chainable(eventuate.constructor, {
    defaulted: 'hello'
  }, function (options) {
    t.equal(options.defaulted, 'hello')
    t.equal(options.lazy, true)
    t.equal(options.destroyResidual, true)
    return upstreamConsumer
  }))(event)

  new (chainable(eventuate.constructor, {
    defaulted : 'hello',
    overridden: 'goodbye'
  }, function (options) {
    t.equal(options.defaulted, 'hello')
    t.equal(options.overridden, 'world')
    t.equal(options.lazy, true)
    t.equal(options.destroyResidual, true)
    return upstreamConsumer
  }))(event, { overridden: 'world' })

  new (chainable(eventuate.constructor, function (options) {
    t.equal(options.overridden, 'world')
    t.equal(options.lazy, true)
    t.equal(options.destroyResidual, true)
    return upstreamConsumer
  }))(event, { overridden: 'world' })

  new (chainable(eventuate.constructor, function (options) {
    t.equal(options.lazy, true)
    t.equal(options.destroyResidual, true)
    return upstreamConsumer
  }))(event)

  function upstreamConsumer () {}
})

test('setting create options do not change default options', function (t) {
  t.plan(3)

  var callNum = 0
  var event = eventuate()
  var Chain = chainable(eventuate.constructor, function (options) {
    switch (callNum) {
      case 0:
        t.equal(options.lazy, true, 'lazy is true during 1st create')
        break
      case 1:
        t.equal(options.lazy, false, 'lazy is false during 2nd create')
        break
      case 2:
        t.equal(options.lazy, true, 'lazy is true during 3rd create')
        break
    }
    callNum++

    return function () {}
  })

  new Chain(event)
  new Chain(event, { lazy: false })
  new Chain(event)
})
