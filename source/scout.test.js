describe('.ensureCount()', () => {
  const { ensureCount } = require('./scout')

  beforeEach(() => {
    stub(console, 'log')
  })

  afterEach(() => {
    sinon.restore()
  })

  context('when the target function returns the correct number of records', () => {
    it('returns the result of the target function', async () => {
      const target = stub().resolves([ 1, 2, 3 ])
      const result = await ensureCount(3, target)

      expect(result).to.deep.eq([ 1, 2, 3 ])
    })
  })

  context('when the target function does not return the correct number of records', () => {
    context('when monitoring is enabled', () => {
      beforeEach(() => process.env.monitor = 'true')
      afterEach(() => delete process.env.monitor)

      it('reports the status', async () => {
        const clock = sinon.useFakeTimers()

        const target = stub()
          .onCall(0).resolves([ 1 ])
          .onCall(1).resolves([ 1, 2 ])

        ensureCount(2, target, { delay: 3 })

        await clock.tickAsync(1)

        expect(console.log).to.have.been.calledOnce
        expect(console.log.firstCall.args[0]).to.include(target.name)
          .and.to.include('Expected: 2')
          .and.to.include('Found: 1')

        await clock.tickAsync(2)

        expect(console.log).to.have.been.calledTwice
        expect(console.log.secondCall.args[0]).to.include(target.name)
          .and.to.include('Found all 2')

        clock.restore()
      })

      it('uses a placeholder name for anonymous functions', async () => {
        await ensureCount(2, () => [ 1, 2 ])

        expect(console.log).to.have.been.calledOnce
        expect(console.log.firstCall.args[0]).to.include('unnamed')
      })
    })

    context('when monitoring is not enabled', () => {
      beforeEach(() => {
        process.env.monitor = false
      })

      it('does not report the status', async () => {
        const target = stub().resolves([ 1, 2, 3 ])
        const result = await ensureCount(3, target)

        expect(console.log).not.to.have.been.called
      })
    })

    it('retries up to the maximum retries', async () => {
      const clock = sinon.useFakeTimers()

      const target = stub()
        .onCall(0).resolves([ 1 ])
        .onCall(1).resolves([ 1 ])
        .onCall(2).resolves([ 1, 2 ])

      ensureCount(2, target, { delay: 3 })
      expect(target).to.have.been.calledOnce

      await clock.tickAsync(3)
      expect(target).to.have.been.calledTwice

      await clock.tickAsync(3)
      expect(target).to.have.been.calledThrice

      await clock.tickAsync(3)
      expect(target).to.have.been.calledThrice

      clock.restore()
    })

    it('handles target functions which do not return a result', async () => {
      const target = stub()
        .onCall(0).returns(undefined)
        .onCall(1).returns([ 1 ])

      await ensureCount(1, target, { delay: 1 })
    })

    it('retries ten times by default', async () => {
      const target = stub().onCall(9).resolves([ 1 ])

      await ensureCount(1, target, { delay: 1 })
      expect(target.callCount).to.eq(10)
    })

    it('delays one second by default', async () => {
      const clock = sinon.useFakeTimers()
      const target = stub().onCall(1).resolves([ 1 ])

      ensureCount(1, target)
      expect(target.callCount).to.eq(1)

      await clock.tickAsync(999)
      expect(target.callCount).to.eq(1)

      await clock.tickAsync(1)
      expect(target.callCount).to.eq(2)

      clock.restore()
    })

    context('when the maximum number of retries is exceeded', () => {
      it('throws an error', async () => {
        let caught
        const target = stub().resolves([ 1 ])

        try {
          await ensureCount(2, target, { delay: 10, retries: 3 })
        }

        catch (error) {
          caught = error
        }

        expect(caught).to.exist
        expect(caught.message).to.include(target.name)
          .and.to.include('3 times')
          .and.to.include('2 records')
          .and.to.include('found 1')
      })
    })
  })
})
