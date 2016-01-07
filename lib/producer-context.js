var FinishedError = require('../errors').FinishedError

module.exports = createProducerContext

function createProducerContext (src, seq) {
  return new ProducerContext(src, seq)
}

function ProducerContext (src, seq, onProduce, onFinish) {
  this.src       = src
  this.seq       = seq
  this.finished  = false
}
ProducerContext.prototype.produce = function (data) {
  if (this.finished)
    throw new FinishedError('attempted to produce after finish', data)
  this.src._onProduce(this.seq, data)
  return this
}
ProducerContext.prototype.produceError = function (err) {
  if (this.finished)
    throw new FinishedError('attempted to produce error after finish', err)
  this.src._onProduce(this.seq, err, true)
  return this
}
ProducerContext.prototype.finish = function () {
  if (!this.finished) {
    this.finished = true
    this.src._onFinish(this.seq)
  }
}

