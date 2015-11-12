var pre       = require('call-hook/pre'),
    post      = require('call-hook/post'),
    assign    = require('object-assign')

module.exports = function createEventuateChainableFactory (defaultOptions, createUpstreamConsumer) {
    if (typeof defaultOptions === 'function') {
        createUpstreamConsumer = defaultOptions
        defaultOptions = undefined
    }
    defaultOptions = assign({ lazy: true, destroyResidual: true}, defaultOptions)

    return createEventuateChain

    function createEventuateChain (upstreamEventuate, createOptions) {
        if (typeof upstreamEventuate.destroyed !== 'function')
            throw new TypeError('first argument should be a non-basic eventuate')

        var options = assign(defaultOptions, typeof createOptions === 'object' ? createOptions : undefined)

        var eventuate        = upstreamEventuate.factory(options),
            consuming        = false,
            args             = Array.prototype.slice.call(arguments, typeof createOptions === 'object' ? 2 : 1),
            upstreamConsumer = createUpstreamConsumer.apply(undefined, [eventuate, options].concat(args))

        eventuate.upstreamConsumer = upstreamConsumer
        eventuate.consume          = pre(eventuate.consume, addUpstreamConsumer)
        eventuate.destroy          = post(eventuate.destroy, removeUpstreamConsumer)

        upstreamEventuate.destroyed(eventuate.destroy)
        upstreamConsumer.removed = upstreamConsumerRemoved
        if (!options.lazy) addUpstreamConsumer()

        return eventuate

        function addUpstreamConsumer () {
            if (!consuming && !eventuate.isDestroyed()) {
                upstreamEventuate.consume(upstreamConsumer)
                consuming = true
            }
        }

        function upstreamConsumerRemoved () {
            consuming = false
            if (!eventuate.isDestroyed() && !upstreamEventuate.isDestroyed())
                addUpstreamConsumer()
        }

        function removeUpstreamConsumer () {
            upstreamEventuate.removeConsumer(upstreamConsumer)
        }
    }
}
