var pre             = require('call-hook/pre'),
    post            = require('call-hook/post'),
    assign          = require('object-assign'),
    producerContext = require('./lib/producer-context')

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
    if (typeof upstreamEventuate.destroyed !== 'function')
      throw new TypeError('first argument should be a non-basic eventuate')

    var gotopts     = typeof createOptions === 'object',
        options     = assign({}, defaults, gotopts ? createOptions : undefined),
        seq         = 0,
        seqWait     = 0,
        outstanding = 0,
        opQueue     = [],
        finished    = 0,
        orderQueue  = {}

    var eventuate = upstreamEventuate.factory(options),
        consuming = false,
        args      = Array.prototype.slice.call(arguments, gotopts ? 2 : 1),
        producer  = producerFactory.apply(undefined, [options].concat(args))

    eventuate.upstreamConsumer = upstreamConsumer
    eventuate.consume          = pre(eventuate.consume, addUpstreamConsumer)
    eventuate.destroy          = post(eventuate.destroy, removeUpstreamConsumer)

    upstreamEventuate.destroyed(eventuate.destroy)
    upstreamConsumer.removed = upstreamConsumerRemoved

    if (!options.lazy)
      addUpstreamConsumer()
    return eventuate

    function upstreamConsumer (data) {
      if (outstanding < options.concurrency)
        start(data)
      else
        opQueue.push(data)
    }

    function start (data) {
      var ctx = options.order
        ? producerContext(seq++, onProduce, deliverPendingOrdered)
        : producerContext(seq, onProduce, startNext)
      producer.call(ctx, data)
      outstanding++
    }

    function onProduce (seq, data) {
      if (options.order && seq !== seqWait)
        orderQueue[seq] = data
      else
        produceConditionally(data)
    }

    function deliverPendingOrdered (finishedSeq) {
      finished++
      var produced = (finishedSeq === seqWait)
      if (produced) while (orderQueue[++seqWait]) {
        var data = orderQueue[seqWait]
        delete orderQueue[seqWait]
        produceConditionally(data)
      }
      if (seq - finished === 0)
        seq = seqWait = finished = 0
      startNext()
    }

    function startNext () {
      outstanding--
      while (outstanding < options.concurrency && opQueue.length > 0)
        start(opQueue.pop())
    }

    function produceConditionally (data) {
      if (!eventuate.isDestroyed())
        eventuate.produce(data)
    }

    function upstreamConsumerRemoved () {
      consuming = false
      if (upstreamEventuate.isDestroyed())
        eventuate.destroy()
      else if (!eventuate.isDestroyed())
        addUpstreamConsumer()
    }

    function addUpstreamConsumer () {
      if (!consuming && !eventuate.isDestroyed()) {
        upstreamEventuate.consume(upstreamConsumer)
        consuming = true
      }
    }

    function removeUpstreamConsumer () {
      if (this.returnValue) {
        upstreamEventuate.destroyed.removeConsumer(eventuate.destroy)
        upstreamEventuate.removeConsumer(upstreamConsumer)
      }
    }
  }
}
