var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('gaurantees order when asked', function (t) {
  t.plan(2)

  var timeouts = [10, 20, 50, 100, 30, 15, 25]

  var eventuateMap = chainable(function (options, map) {
    var idx = 0
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
      }, timeouts[idx++])
    }
  })

  var event = eventuate(),
      unorderedList = [],
      orderedList   = []
  eventuateMap(event, function (data) {
    return data.toUpperCase()
  }).consume(function (l) {
    unorderedList.push(l)
  })
  eventuateMap(event, { order: true }, function (data) {
    return data.toUpperCase()
  }).consume(function (l) {
    orderedList.push(l)
  })

  event.produce('a')
  event.produce('b')
  event.produce('c')
  event.produce('d')
  event.produce('e')
  event.produce('f')
  event.produce('g')

  setTimeout(function () {
    t.pass('unordered list: ' + unorderedList.join(', '))
    t.deepEqual(orderedList, ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                'ordered list: ' + orderedList.join(', '))
  }, 500)
})

test('sequence should reset when queue catches up', function (t) {
  t.plan(4)

  var timeouts = [50, 20]

  var eventuateMap = chainable(function (options, map) {
    var idx = 0
    return function upstreamConsumer (data) {
      var self = this
      if (data === 'a')
        t.equal(self.seq, 0, 'seq for a === 0')
      else
        t.ok(self.seq !== 0, 'seq for b !== 0')
      setTimeout(function () {
        self.finish()
      }, timeouts[idx++])
    }
  })

  var event = eventuate()
  eventuateMap(event, { order: true }, function (data) {
    return data.toUpperCase()
  }).consume(function (l) {})

  event.produce('a')
  event.produce('b')

  setTimeout(function () {
    event.produce('a')
    event.produce('b')
  }, 100)
})

test('calling finish twice has no affect', function (t) {
  t.plan(1)

  var timeouts = [50, 20]

  var eventuateMap = chainable(function (options, map) {
    var idx = 0
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
        self.finish()
      }, timeouts[idx++])
    }
  })

  var event = eventuate()
  eventuateMap(event, { order: true }, function (data) {
    return data.toUpperCase()
  }).consume(function (l) {})

  var orderedList = []
  eventuateMap(event, { order: true }, function (data) {
    return data.toUpperCase()
  }).consume(function (l) {
    orderedList.push(l)
  })
  event.produce('a')
  event.produce('b')

  setTimeout(function () {
    t.deepEqual(orderedList, ['A', 'B'])
  }, 100)
})

test('does not attempt to produce if destroyed', function (t) {
  t.plan(1)

  var timeouts = [10, 20, 50, 100, 30, 15, 25],
      count    = 0

  var eventuateMap = chainable(function (options, map) {
    var idx = 0
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
        count++
      }, timeouts[idx++])
    }
  })

  var event = eventuate()
  var ucEvent = eventuateMap(event, function (data) {
    return data.toUpperCase()
  }).consume(function () {
    t.fail('nothing should be produced')
  })

  event.produce('a')
  event.produce('b')
  event.produce('c')
  event.produce('d')
  event.produce('e')
  event.produce('f')
  event.produce('g')
  setImmediate(ucEvent.destroy)

  setTimeout(function () {
    t.equal(count, 7)
  }, 200)
})
