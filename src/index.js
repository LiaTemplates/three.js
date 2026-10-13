import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { Viewer, create, registry } from './viewer.js'
import { Builder } from './builder.js'
import * as dsl from './dsl.js'

/** line and column of an error inside code that was run with new Function */
function location(e, offset) {
  const stack = String(e.stack || '')
  const m = stack.match(/(?:<anonymous>|Function):(\d+):(\d+)/)
  if (m) return { line: Math.max(1, Number(m[1]) - offset), column: Math.max(0, Number(m[2]) - 1) }
  if (e.lineNumber) return { line: Math.max(1, e.lineNumber - offset), column: e.columnNumber || 0 }
  return null
}

// three.js plus the addons that are part of the bundle
const THREE_ALL = Object.assign({}, THREE, { OrbitControls, GLTFLoader, CSS2DRenderer, CSS2DObject })

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

/** run JavaScript with the viewer and all builder functions as variables */
function runJS(viewer, code) {
  const names = ['THREE', 'viewer', 'scene', 'camera', 'renderer', 'controls', 'B', 'onFrame', ...Builder.API]
  const values = [
    THREE_ALL,
    viewer,
    viewer.scene,
    viewer.perspective,
    viewer.renderer,
    viewer.controls,
    viewer.B,
    viewer.onFrame.bind(viewer),
    ...Builder.API.map((n) => viewer.B[n].bind(viewer.B)),
  ]
  const before = viewer.perspective.position.clone()
  const isAsync = /\bawait\b/.test(code)
  let fn
  try {
    fn = isAsync ? new AsyncFunction(...names, code) : new Function(...names, code)
  } catch (e) {
    const loc = location(e, 2)
    e.liaLine = loc ? loc.line : undefined
    e.liaColumn = loc ? loc.column : 0
    throw e
  }
  const done = () => {
    // only fit the camera if the code did not move it
    if (!viewer.cameraLocked && !before.equals(viewer.perspective.position)) {
      viewer.view({ camera: viewer.perspective.position.toArray(), target: viewer.controls.target.toArray() })
    }
    viewer.fit()
  }
  try {
    const result = fn(...values)
    if (isAsync) {
      return result.then(done).catch((e) => {
        const loc = location(e, 2)
        console.error((loc ? `line ${loc.line}: ` : '') + (e.message || e))
      })
    }
  } catch (e) {
    const loc = location(e, 2)
    e.liaLine = loc ? loc.line : undefined
    e.liaColumn = loc ? loc.column : 0
    done()
    throw e
  }
  done()
}

function runBuilding(viewer, code) {
  try {
    return dsl.run(viewer, code)
  } finally {
    // show everything that was built, also if a line contains an error
    viewer.fit()
  }
}

function runModel(viewer, url) {
  return viewer.load(url).catch((e) => viewer.error('Could not load ' + url + ': ' + (e.message || e)))
}

const RUNNERS = { js: runJS, building: runBuilding, gltf: runModel }

/**
 * Called by the LiaScript macros.
 *   id      - id of the container div
 *   code    - JavaScript, a building description, or an url
 *   mode    - "js" | "building" | "gltf"
 *   send    - the LiaScript send object of the script tag
 *   overlay - show errors inside the 3D view (for hidden code)
 * Returns "LIA: stop" or "LIA: wait" (if the container is not yet in the DOM).
 * Errors that happen synchronously are thrown with `liaLine` for editor annotations.
 */
function exec(id, code, mode = 'js', send, overlay = false) {
  const runner = RUNNERS[mode]
  if (!runner) throw new Error('unknown mode ' + mode)

  const start = (el) => {
    const viewer = create(el)
    try {
      runner(viewer, code)
    } catch (e) {
      if (overlay) viewer.error((e.liaLine ? `line ${e.liaLine}: ` : '') + e.message)
      throw e
    }
    return viewer
  }

  const el = document.getElementById(id)
  if (el) {
    start(el)
    return 'LIA: stop'
  }

  let tries = 0
  const retry = () => {
    const el = document.getElementById(id)
    if (el) {
      try {
        start(el)
      } catch (e) {
        console.error((e.liaLine ? `line ${e.liaLine}: ` : '') + e.message)
      }
      if (send) send.lia('LIA: stop')
    } else if (tries++ < 100) {
      setTimeout(retry, 50)
    } else if (send) {
      send.lia('LIA: stop')
    }
  }
  setTimeout(retry, 0)
  return 'LIA: wait'
}

window.THREE = THREE_ALL
window.LiaThree = {
  THREE: THREE_ALL,
  Viewer,
  viewers: registry,
  Builder,
  create,
  exec,
  dsl,
  runJS,
  runBuilding,
  version: '0.1.0',
}
