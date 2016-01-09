/*eslint no-new:0*/
var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('requires an eventuate constructor', function (t) {
  t.plan(1)
  t.throws(chainable, TypeError)
})

test('chainable factory is passed options, and all other args', function (t) {
  t.plan(11)

  var event = eventuate()
  t.throws(function () {
    new (chainable(eventuate, function (options) {
      return upstreamConsumer
    }))(1, 2)
  }, TypeError)

  new (chainable(eventuate, {
    defaulted: 'hello'
  }, function (options) {
    t.equal(arguments.length, 3)
    t.equal(arguments[1], 1)
    t.equal(arguments[2], 2)
    return upstreamConsumer
  }))(event, 1, 2)

  new (chainable(eventuate, {
    defaulted : 'hello',
    overridden: 'goodbye'
  }, function (options) {
    t.equal(arguments.length, 2)
    t.equal(arguments[1], 'a')
    return upstreamConsumer
  }))(event, { overridden: 'world' }, 'a')

  new (chainable(eventuate, function (options) {
    t.equal(arguments.length, 2)
    t.equal(typeof arguments[1], 'function')
    return upstreamConsumer
  }))(event, { overridden: 'world' }, function () {})

  new (chainable(eventuate, function (options) {
    t.equal(arguments.length, 3)
    t.equal(typeof arguments[1], 'function')
    t.equal(arguments[2], 1)
    return upstreamConsumer
  }))(event, function () {}, 1)

  function upstreamConsumer () {}
})

test('supports passing constructor or factory', function (t) {
  t.plan(2)

  var event = eventuate()
  var Mapped1 = chainable(eventuate, function (options, map) {
    return function (value) {
      this.produce(map(value)).finish()
    }
  })
  var Mapped2 = chainable(eventuate.constructor, function (options, map) {
    return function (value) {
      this.produce(map(value)).finish()
    }
  })
  var mapped1 = new Mapped1(event, function (v) {
    return v.toUpperCase()
  })
  var mapped2 = new Mapped2(event, function (v) {
    return v.toUpperCase()
  })
  mapped1.consume(onData)
  mapped2.consume(onData)
  event.produce('a')

  function onData (v) {
    t.equal(v, 'A')
  }
})
