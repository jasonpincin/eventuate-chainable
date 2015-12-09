var test      = require('tape'),
    assign    = require('object-assign'),
    eventuate = require('eventuate-core'),
    chainable = require('../mixin')

test('mixin pattern works', function (t) {
  t.plan(1)

  var upstream        = eventuate(),
      eventuateMapped = eventuate()
  assign(eventuateMapped, chainable.properties)
  chainable.call(eventuateMapped, upstream, function forEach (value) {
    this.produce(value.toUpperCase()).finish()
  })

  eventuateMapped.consume(function (value) {
    t.equal(value, 'ABC')
  })
  upstream.produce('abc')
})
