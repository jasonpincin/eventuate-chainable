var assign          = require('object-assign'),
    mixin           = require('./mixin')

module.exports = function createChainableFactory (defaults, producerFactory) {
  if (typeof defaults === 'function') {
    producerFactory = defaults
    defaults = undefined
  }
  defaults = assign({
    lazy           : true,
    order          : false,
    concurrency    : Infinity,
    destroyResidual: true
  }, defaults)

  return createEventuateChainable

  function createEventuateChainable (upstreamEventuate, createOptions) {
    var gotopts = typeof createOptions === 'object',
        options = assign({}, defaults, gotopts ? createOptions : undefined)

    var args      = Array.prototype.slice.call(arguments, gotopts ? 2 : 1),
        producer  = producerFactory.apply(undefined, [options].concat(args))

    var eventuate = upstreamEventuate.factory(options)
    assign(eventuate, mixin.properties)
    mixin.call(eventuate, upstreamEventuate, options, producer)

    return eventuate
  }
}
