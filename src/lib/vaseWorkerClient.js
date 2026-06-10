// Singleton geometry worker with latest-wins scheduling: while a job is
// running, newer requests overwrite the single pending slot, so intermediate
// slider values are skipped and only the most recent params get computed.
const worker = new Worker(new URL('./vaseGeometry.worker.js', import.meta.url), {
  type: 'module',
})

let nextId = 0
let busy = false
let pendingJob = null
const listeners = new Set()

export function requestGeometry(vaseData, quality = 'full') {
  const job = { id: ++nextId, vaseData, quality }
  if (busy) {
    pendingJob = job
  } else {
    busy = true
    worker.postMessage(job)
  }
  return job.id
}

function drainPending() {
  busy = false
  if (pendingJob) {
    const job = pendingJob
    pendingJob = null
    busy = true
    worker.postMessage(job)
  }
}

worker.onmessage = ({ data }) => {
  drainPending()
  // data is { id, positions, normals, index } or { id, error }
  listeners.forEach((fn) => fn(data))
}

// Backstop for failures outside the worker's own try/catch (e.g. the worker
// script failing to load); job errors arrive through onmessage as { error }.
worker.onerror = (e) => {
  console.error('[vaseWorker]', e.message || e)
  drainPending()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
