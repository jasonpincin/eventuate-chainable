var FinishedError = require('../errors').FinishedError

module.exports = createProducerContext

function createProducerContext (seq, onProduce, onFinish) {
  return new ProducerContext(seq, onProduce, onFinish)
}

function ProducerContext (seq, onProduce, onFinish) {
  this.seq       = seq
  this.finished  = false
  this.onProduce = onProduce
  this.onFinish  = onFinish
}
ProducerContext.prototype.produce = function (data) {
  if (this.finished)
    throw new FinishedError('attempted to produce after finish', data)
  this.onProduce(this.seq, data)
  return this
}
ProducerContext.prototype.error = function (err) {
  return this.produce(err instanceof Error ? err : new Error(err))
}
ProducerContext.prototype.finish = function () {
  if (!this.finished) {
    this.finished = true
    this.onFinish(this.seq)
  }
}

