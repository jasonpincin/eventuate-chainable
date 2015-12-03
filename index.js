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

    var gotopts = typeof createOptions === 'object',
        options = assign({}, defaults, gotopts ? createOptions : undefined)

    var seq                = 0,
        seqWait            = 0,
        outstanding        = 0,
        opQueue            = [],
        finished           = 0,
        orderQueue         = {}

    var eventuate = upstreamEventuate.factory(options),
        consuming = null,
        args      = Array.prototype.slice.call(arguments, gotopts ? 2 : 1),
        producer  = producerFactory.apply(undefined, [options].concat(args))

    eventuate.upstreamConsumer = upstreamConsumer
    eventuate.consume          = pre(eventuate.consume, addUpstreamConsumer)
    eventuate.destroy          = post(eventuate.destroy, removeUpstreamConsumer)

    eventuate._consumerSaturated   = setSaturated
    eventuate._consumerUnsaturated = consumerUnsaturated

    upstreamEventuate.destroyed(destroySelf)
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
      var s = options.order ? seq++ : seq
      var ctx = producerContext(s, onProduce, onFinish)
      producer.call(ctx, data)
      outstanding++
      if (outstanding >= options.concurrency)
        setSaturated()
    }

    function onProduce (seq, data) {
      if (options.order && seq !== seqWait)
        orderQueue[seq] = data
      else
        produceConditionally(data)
    }

    function onFinish (finishedSeq) {
      outstanding--
      if (options.order) {
        finished++
        var produced = (finishedSeq === seqWait)
        if (produced) while (orderQueue[++seqWait]) {
          var data = orderQueue[seqWait]
          delete orderQueue[seqWait]
          produceConditionally(data)
        }
        if (seq - finished === 0)
          seq = seqWait = finished = 0
      }
      while (outstanding < options.concurrency && opQueue.length > 0)
        start(opQueue.pop())
      if (outstanding < options.concurrency && !someConsumersSaturated())
        setUnsaturated()
    }

    function produceConditionally (data) {
      if (!eventuate.isDestroyed())
        eventuate.produce(data)
    }

    function upstreamConsumerRemoved () {
      consuming = null
      if (upstreamEventuate.isDestroyed())
        eventuate.destroy()
      else if (!eventuate.isDestroyed())
        addUpstreamConsumer()
    }

    function addUpstreamConsumer () {
      if (!consuming && !eventuate.isDestroyed()) {
        consuming = upstreamEventuate.consume(upstreamConsumer)
      }
    }

    function removeUpstreamConsumer () {
      if (this.returnValue) {
        upstreamEventuate.destroyed.removeConsumer(destroySelf)
        upstreamEventuate.removeConsumer(upstreamConsumer)
      }
    }

    function destroySelf () {
      eventuate.destroy()
    }

    function setSaturated (consumer) {
      if (!eventuate._saturated) {
        eventuate._saturated = true
        eventuate.saturated.produce(consumer)
        if (consuming) consuming.saturated()
      }
    }

    function setUnsaturated () {
      eventuate._saturated = false
      eventuate.unsaturated.produce()
      if (consuming) consuming.unsaturated()
    }

    function consumerUnsaturated (consumer) {
      if (outstanding >= options.concurrency && !someConsumersSaturated())
        setUnsaturated()
    }

    function someConsumersSaturated () {
      return eventuate.getConsumers().some(filterSaturated)
    }

    function filterSaturated (consumer) {
      return consumer._saturated
    }
  }
}
