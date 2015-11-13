# eventuate-chainable

[![NPM version](https://badge.fury.io/js/eventuate-chainable.png)](http://badge.fury.io/js/eventuate-chainable)
[![Build Status](https://travis-ci.org/jasonpincin/eventuate-chainable.svg?branch=master)](https://travis-ci.org/jasonpincin/eventuate-chainable)
[![Coverage Status](https://coveralls.io/repos/jasonpincin/eventuate-chainable/badge.png?branch=master)](https://coveralls.io/r/jasonpincin/eventuate-chainable?branch=master)

Create eventuates that consume from other eventuates.

## example

```javascript
var eventuate          = require('eventuate-core'),
    eventuateChainable = require('eventuate-chainable')

// create a chainable eventuate mapper
var map = eventuateChainable(function (eventuate, options, map) {
    return function upstreamConsumer (data) {
        eventuate.produce(map(data))
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

// produce stuff on numbers, watch as the square of it is logged via squareNumbers
numbers.produce(1)
numbers.produce(2)
numbers.produce(3)
numbers.produce(4)
```

## api

```javascript
var chainable = require('eventuate-chainable')
```

#### chainableFactory = chainable([defaults], upstreamConsumerFactory)

Create a chainable eventuate factory, `chainableFactory`, that can be used to
create new eventuates that consume from other eventuates. Accepts an optional
`defaults`, which will set the default set of options for chainable
eventuates created by the factory, and `upstreamConsumerFactory`, which will be
invoked when the `chainableFactory` is called to create an eventuate, and is expected to
return a function that accepts data produced by an upstream eventuate.

The factory returned has a signature of: 

```javascript
function chainableFactory (upstreamEventuate [, options, arg3, arg4, ...]) {}
```

The only required argument for the `chainableFactory` us the `upstreamConsumer`
from which it will consume. If `options` are provided, they will be merged with
`defaults` set at the time the `chainableFactory` was created. 

When `chainableFactory` is called, it will call `upstreamConsumerFactory`, which
is expected to have a signature of:

```javascript
function upstreamConsumerFactory (newEventuate, options [, arg3, arg4, ...]) {}
```

The `upstreamConsumerFactory` will be called with the newly created
`newEventuate` (which will be returned by `chainableFactory`), `options` 
(which has been merged with `defaults`), and any other arguments that were
supplied to `chainableFactory`.

`upstreamConsumerFactory` is expected to return a function that will be called
for each thing produced by `upstreamEventuate`. This function should have the
signature of:

```javascript
function upstreamConsumer (data) {}
```

## behaviour

Chainable eventuates produced in this way have the following characteristics:

### lazy consumption

Chainable eventuates do not start consuming from their upstream eventuate until
a consumer has been added. This can be changed by setting the option `{ lazy:
false }`.

### upstream consumer maintained

If the `upstreamConsumer` added to the `upstreamEventuate` by the chainable 
eventuate is removed for any reason (such as `removeAllConsumers` being called 
on the `upstreamEventuate`), it will be replaced immediately. If either the 
`upstreamEventuate` or the chainable eventuate are destroyed, the 
`upstreamConsumer` will be removed as expected.

### residuals destroyed

By default, when the last consumer is removed from a chainable eventuate, the
chainable eventuate is destroyed (`destroy()` is called). This can be changed by
setting the option `{ destroyResidual: false }`.

## install

With [npm](https://npmjs.org) do:

```
npm install --save eventuate-chainable
```

## testing

`npm test`

Or to run tests in phantom: `npm run phantom`

### coverage

`npm run view-cover`

This will output a textual coverage report.

`npm run open-cover`

This will open an HTML coverage report in the default browser.
