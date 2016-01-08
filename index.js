var assign          = require('object-assign'),
    producerContext = require('./lib/producer-context')

module.exports = createConstructor

function createConstructor (Super, defaults, producerFactory) {
  if (typeof Super.isEventuate !== 'function')
    throw new TypeError('first argument should be an Eventuate constructor')
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

  function Eventuate (upstream, options) {
    if (!(typeof upstream.consume === 'function'))
      throw new TypeError('first argument should be an eventuate')
    Super.call(this, options)

    var self      = this,
        hasopts   = (typeof options === 'object'),
        _options  = assign({}, defaults, hasopts ? options : {})

    assign(this, {
      upstreamConsumer     : upstreamConsumer,
      upstreamErrorConsumer: upstreamErrorConsumer,
      _options             : _options,
      _seq                 : 0,
      _seqWait             : 0,
      _outstanding         : 0,
      _opQueue             : [],
      _finished            : 0,
      _orderQueue          : {},
      _upstreamConsumption : null,
      _upstream            : upstream,
      _destroying          : false,
      _destroySelfSoon     : _destroySelfSoon,
      _producer            : producerFactory.apply(
        undefined,
        [_options].concat(Array.prototype.slice.call(
          arguments,
          hasopts ? 2 : 1
        ))
      )
    })

    self.on('firstConsumerAdded', firstConsumerAdded)
    self.on('lastConsumerRemoved', lastConsumerRemoved)
    self.on('saturated', saturated)
    self.on('unsaturated', unsaturated)
    self.once('destroy', destroyed)

    self._upstream.once('destroy', upstreamDestroyed)

    if (!self._options.lazy)
      self._addUpstreamConsumer()

    function firstConsumerAdded () {
      self._addUpstreamConsumer()
    }

    function lastConsumerRemoved () {
      self._removeUpstreamConsumer()
    }

    function saturated () {
      if (self._upstreamConsumption)
        self._upstreamConsumption.saturated()
    }

    function unsaturated () {
      if (self._upstreamConsumption)
        self._upstreamConsumption.unsaturated()
    }

    function destroyed () {
      self._removeUpstreamConsumer()
    }

    function upstreamDestroyed () {
      self._destroySoon()
    }

    function upstreamConsumer (data) {
      var concurrency = self._options.concurrency
      if (self._outstanding < concurrency)
        self._start(data)
      else
        self._opQueue.push(data)
    }

    function upstreamErrorConsumer (err) {
      self.produceError(err)
    }

    function _destroySelfSoon () {
      self._destroySoon()
    }
  }
  assign(Eventuate.prototype, Super.prototype, {
    constructor            : Eventuate,
    _start                 : _start,
    _onProduce             : _onProduce,
    _onFinish              : _onFinish,
    _produceConditionally  : _produceConditionally,
    _addUpstreamConsumer   : _addUpstreamConsumer,
    _removeUpstreamConsumer: _removeUpstreamConsumer,
    _consumerUnsaturated   : _consumerUnsaturated,
    _someConsumersSaturated: _someConsumersSaturated,
    _noConsumersSaturated  : _noConsumersSaturated,
    _destroySoon           : _destroySoon
  })

  return Eventuate
}

function _start (data) {
  var s = this._options.order ? this._seq++ : this._seq
  var ctx = producerContext(this, s)
  this._producer.call(ctx, data)
  this._outstanding++
  if (this._outstanding >= this._options.concurrency)
    this._setSaturated()
}

function _onProduce (seq, data, isErr) {
  if (this._options.order && seq !== this._seqWait)
    this._orderQueue[seq] = [data, isErr]
  else
    this._produceConditionally(data, isErr)
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
      this._produceConditionally.apply(this, data)
    }
    if (this._seq - this._finished === 0)
      this._seq = this._seqWait = this._finished = 0
  }
  while (this._outstanding < options.concurrency && this._opQueue.length > 0)
    this._start(this._opQueue.pop())
  if (this._outstanding < options.concurrency && this._noConsumersSaturated())
    this._setUnsaturated()
  if (this._outstanding === 0 && this._destroying)
    this.destroy()
}

function _produceConditionally (data, isErr) {
  if (!this._destroyed)
    this[isErr ? 'produceError' : 'produce'](data)
}

function _addUpstreamConsumer () {
  if (!this._upstreamConsumption && !this._destroyed) {
    this._upstreamConsumption = this._upstream.consume(
      this.upstreamConsumer,
      this.upstreamErrorConsumer
    )
    this._upstreamConsumption.once('end', this._destroySelfSoon)
  }
}

function _removeUpstreamConsumer () {
  if (this._upstreamConsumption) {
    this._upstreamConsumption.removeListener('end', this._destroySelfSoon)
    this._upstreamConsumption.end()
  }
}

function _destroySoon () {
  if (!this._outstanding)
    this.destroy()
  else {
    this._destroying = true
    this._removeUpstreamConsumer()
  }
}

function _consumerUnsaturated (consumer) {
  var concurrency = this._options.concurrency
  if (this._outstanding < concurrency && this._noConsumersSaturated())
    this._setUnsaturated()
}

function _someConsumersSaturated () {
  return this.consumers().some(filterSaturated)
}

function _noConsumersSaturated () {
  return !this._someConsumersSaturated()
}

function filterSaturated (consumer) {
  return consumer._saturated
}
