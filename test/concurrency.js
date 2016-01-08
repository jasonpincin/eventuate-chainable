var test      = require('tape'),
    eventuate = require('eventuate-core'),
    chainable = require('..')

test('supports concurrency option', function (t) {
  t.plan(2)

  var timeouts = [10, 20, 50, 100, 30, 15, 25]

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
    var idx = 0
    return function upstreamConsumer (data) {
      var self = this
      setTimeout(function () {
        self.produce(map(data)).finish()
      }, timeouts[idx++])
    }
  })

  var event        = eventuate(),
      startTime    = Date.now(),
      seriesTime   = null,
      parallelTime = null

  new EventuateMap(event, function (data) {
    return data.toUpperCase()
  }).consume(function (l) {
    parallelTime = Date.now() - startTime
  })
  new EventuateMap(event, { concurrency: 1 }, function (data) {
    return data.toUpperCase()
  }).consume(function (l) {
    seriesTime = Date.now() - startTime
  })

  event.produce('a')
  event.produce('b')
  event.produce('c')
  event.produce('d')
  event.produce('e')
  event.produce('f')
  event.produce('g')

  var totalTime = timeouts.reduce(function (a, b) {
    return a + b
  })
  var maxTime = Math.max.apply(null, timeouts)
  setTimeout(function () {
    t.comment('total time: ' + totalTime + ' / max time: ' + maxTime)
    t.ok(seriesTime >= totalTime, 'series time: ' + seriesTime)
    t.ok(parallelTime <= maxTime + 25, 'parallel time : ' + parallelTime)
  }, 500)
})

test('concurrency and order work together', function (t) {
  t.plan(2)

  var timeouts = [10, 20, 50, 100, 30, 15, 25]

  var EventuateMap = chainable(eventuate.constructor, function (options, map) {
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
  new EventuateMap(event, { concurrency: 2 }, function (data) {
    return data.toUpperCase()
  }).consume(function (l) {
    unorderedList.push(l)
  })
  new EventuateMap(event, { order: true, concurency: 2 }, function (data) {
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
