var
  test      = require('tape'),
  eventuate = require('eventuate-core'),
  chainable = require('..')

test('should create a mapper', function (t) {
  t.plan(1)

  var eventuateMap = chainable(function (options, map) {
    return function upstreamConsumer (data) {
      this.produce(map(data)).finish()
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
