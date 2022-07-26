const wait = require('waait')

// ---------------------------------------------

async function ensureCount(count, target, options = {}) {
  function message(text) {
    return `[scout: ${ target.name || 'unnamed' }] ${ text }`
  }

  attempt = options.attempt || 0
  delay = options.delay || 1000
  retries = options.retries || 10

  attempt++
  const result = await target() || []

  if (result.length === count) {
    if (process.env.monitor === 'true') {
      console.log(message(`Found all ${ count } records.`))
    }

    return result
  }

  if (attempt === retries) {
    throw new Error(message(`Tried ${ attempt } times to find ${ count } records, but only found ${ result.length }.`))
  }

  if (attempt < retries) {
    if (process.env.monitor === 'true') {
      console.log(message(`Expected: ${ count } | Found: ${ result.length }`))
    }

    await wait(delay)
    await ensureCount(count, target, { attempt, delay, retries })
  }
}

// ---------------------------------------------

module.exports = {
  ensureCount
}
