var
  eventuate          = require('eventuate-core'),
  eventuateChainable = require('..')

// create a chainable eventuate mapper
var map = eventuateChainable(function eventuateMap (options, map) {
  return function forEachValue (value) {
    this.produce(map(value))
    this.finish()
  }
})

// create an eventuate
var numbers = eventuate()

// map the eventuate using the chainable mapper we created above
var squareNumbers = map(numbers, function (num) {
  return num * num
})

// log anything produced by squareNumbers
squareNumbers(console.log)

// produce stuff on numbers, the square of it is logged via squareNumbers
numbers.produce(1)
numbers.produce(2)
numbers.produce(3)
numbers.produce(4)

// Chainables consume lazily (only when they have consumers themselves)
// and clean up after themselves when all consumers are removed
// or when the upstream eventuate is destroyed.
//
// They also maintain they're upstreamConsumer, even if removeAllConsumers is
// called on the upstream eventuate. If either eventuate is destroyed, the
// right thing is done.
