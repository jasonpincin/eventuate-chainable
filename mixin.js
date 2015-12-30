var assign          = require('object-assign'),
    producerContext = require('./lib/producer-context')

module.exports = assign(function eventuate (upstream, options, reproducer) {
  if (typeof upstream.destroyed !== 'function')
    throw new TypeError('first argument should be a non-basic eventuate')

  if (typeof options === 'function') {
    reproducer = options
    options = {}
  }

  options = assign({
    lazy           : true,
    order          : false,
    concurrency    : Infinity,
    destroyResidual: true
  }, options)

  var self = this
  assign(this, {
    upstreamConsumer     : upstreamConsumer,
    upstreamErrorConsumer: upstreamErrorConsumer,
    _options             : options,
    _seq                 : 0,
    _seqWait             : 0,
    _outstanding         : 0,
    _opQueue             : [],
    _finished            : 0,
    _orderQueue          : {},
    _upstreamConsumption : null,
    _upstream            : upstream,
    _destroySelf         : _destroySelf,
    _reproducer          : reproducer
  })

  assign(upstreamConsumer, {
    removed: upstreamConsumerRemoved
  })

  upstream.destroyed(_destroySelf)
  if (!options.lazy)
    this._addUpstreamConsumer()

  return this

  function upstreamConsumer (data) {
    if (self._outstanding < options.concurrency)
      self._start(data)
    else
      self._opQueue.push(data)
  }

  function upstreamErrorConsumer (err) {
    self.produceError(err)
  }

  function upstreamConsumerRemoved () {
    self._upstreamConsumption = null
    if (self._upstream.isDestroyed())
      self.destroy()
    else if (!self.isDestroyed())
      self._addUpstreamConsumer()
  }

  function _destroySelf () {
    self.destroy()
  }
}, { properties: {
  consume                : consume,
  removeConsumer         : removeConsumer,
  destroy                : destroy,
  _start                 : _start,
  _onProduce             : _onProduce,
  _onFinish              : _onFinish,
  _produceConditionally  : _produceConditionally,
  _addUpstreamConsumer   : _addUpstreamConsumer,
  _removeUpstreamConsumer: _removeUpstreamConsumer,
  _setSaturated          : _setSaturated,
  _setUnsaturated        : _setUnsaturated,
  _consumerUnsaturated   : _consumerUnsaturated,
  _someConsumersSaturated: _someConsumersSaturated,
  _noConsumersSaturated  : _noConsumersSaturated
}})

function consume () {
  this._addUpstreamConsumer()
  return this._upstream.consume.apply(this, arguments)
}

function removeConsumer () {
  var result = this._upstream.removeConsumer.apply(this, arguments)
  if (!this.hasConsumer())
    this._removeUpstreamConsumer()
  return result
}

function destroy () {
  var result = this._upstream.destroy.apply(this, arguments)
  if (result) this._removeUpstreamConsumer()
  return result
}

function _start (data) {
  var s = this._options.order ? this._seq++ : this._seq
  var ctx = producerContext(this, s, this._onProduce, this._onFinish)
  this._reproducer.call(ctx, data)
  this._outstanding++
  if (this._outstanding >= this._options.concurrency)
    this._setSaturated()
}

function _onProduce (seq, data) {
  if (this._options.order && seq !== this._seqWait)
    this._orderQueue[seq] = data
  else
    this._produceConditionally(data)
}

function _onFinish (finishedSeq) {
  var options = this._options
  this._outstanding--
  if (this._options.order) {
    this._finished++
    var produced = (finishedSeq === this._seqWait)
    if (produced) while (this._orderQueue[++this._seqWait]) {
      var data = this._orderQueue[this._seqWait]
      delete this._orderQueue[this._seqWait]
      this._produceConditionally(data)
    }
    if (this._seq - this._finished === 0)
      this._seq = this._seqWait = this._finished = 0
  }
  while (this._outstanding < options.concurrency && this._opQueue.length > 0)
    this._start(this._opQueue.pop())
  if (this._outstanding < options.concurrency && this._noConsumersSaturated())
    this._setUnsaturated()
}

function _produceConditionally (data) {
  if (!this.isDestroyed())
    this.produce(data)
}

function _addUpstreamConsumer () {
  var self = this.context || this
  if (!self._upstreamConsumption && !self.isDestroyed()) {
    self._upstreamConsumption = self._upstream.consume(
      self.upstreamConsumer,
      self.upstreamErrorConsumer)
  }
}

function _removeUpstreamConsumer () {
  if (this._upstreamConsumption) {
    this._upstream.destroyed.removeConsumer(this._destroySelf)
    this._upstreamConsumption.end()
  }
}

function _setSaturated (consumer) {
  if (!this._saturated) {
    this._saturated = true
    this.saturated.produce(consumer)
    if (this._upstreamConsumption) this._upstreamConsumption.saturated()
  }
}

function _setUnsaturated () {
  this._saturated = false
  this.unsaturated.produce()
  if (this._upstreamConsumption) this._upstreamConsumption.unsaturated()
}

function _consumerUnsaturated (consumer) {
  var options = this._options
  if (this._outstanding < options.concurrency && this._noConsumersSaturated())
    this._setUnsaturated()
}

function _someConsumersSaturated () {
  return this.getConsumers().some(filterSaturated)
}

function _noConsumersSaturated () {
  return !this._someConsumersSaturated()
}

function filterSaturated (consumer) {
  return consumer._saturated
}
