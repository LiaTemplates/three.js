import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Builder } from './builder.js'

const STYLE_ID = 'lia-three-style'

const CSS = `
.lia-three {
  position: relative; width: 100%; height: 450px; min-height: 200px;
  overflow: hidden; resize: vertical; border-radius: 4px;
  user-select: none; -webkit-user-select: none; touch-action: none;
}
.lia-three canvas { display: block; outline: none; }
.lia-three:fullscreen { resize: none; border-radius: 0; }
.lia-three .lt-bar {
  position: absolute; top: 6px; right: 6px; z-index: 2;
  display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end;
}
.lia-three .lt-bar button {
  width: 30px; height: 30px; padding: 0; border: 0; border-radius: 4px; cursor: pointer;
  background: rgba(255,255,255,.85); color: #222; font-size: 16px; line-height: 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
}
.lia-three .lt-bar button:hover { background: #fff; }
.lia-three .lt-bar button.lt-on { background: #1e88e5; color: #fff; }
.lia-three .lt-slider {
  position: absolute; top: 42px; right: 6px; z-index: 2; display: none;
  background: rgba(255,255,255,.85); border-radius: 4px; padding: 4px 8px;
  font: 12px sans-serif; color: #222; box-shadow: 0 1px 3px rgba(0,0,0,.25);
  align-items: center; gap: 6px;
}
.lia-three .lt-slider input { width: 140px; }
.lia-three .lt-info {
  position: absolute; left: 8px; bottom: 8px; z-index: 2; display: none;
  max-width: min(360px, 70%); max-height: 50%; overflow: auto;
  background: rgba(255,255,255,.93); color: #222; border-radius: 4px;
  padding: 6px 28px 6px 10px; font: 14px/1.4 sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,.3);
}
.lia-three .lt-info b { display: block; margin-bottom: 2px; }
.lia-three .lt-info .lt-close {
  position: absolute; top: 2px; right: 6px; cursor: pointer; font-size: 16px;
}
.lia-three .lt-label {
  font: 13px/1.2 sans-serif; color: #111; background: rgba(255,255,255,.8);
  padding: 1px 5px; border-radius: 3px; white-space: nowrap; pointer-events: none;
}
.lia-three .lt-error {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  padding: 1em; text-align: center; font: 14px sans-serif; color: #b00; background: #fff;
}
`

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

export const registry = {}

const DEFAULTS = {
  height: 450,
  background: '#dfeaf5',
  ground: true,
  groundColor: '#b5c99a',
  groundSize: 0, // 0 = automatic
  grid: false,
  shadows: true,
  autoRotate: false,
  toolbar: true,
  camera: null,
  target: null,
}

const toVec = (v) => (Array.isArray(v) ? new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0) : v)

export class Viewer {
  constructor(container, options = {}) {
    injectStyle()

    // dispose an older viewer living in the same container (re-run of a code block)
    if (container.id && registry[container.id]) registry[container.id].dispose()
    if (container.id) registry[container.id] = this

    this.THREE = THREE
    this.container = container
    this.options = Object.assign({}, DEFAULTS, options)
    this.frameCallbacks = []
    this.disposed = false
    this.visible = true
    this.cameraLocked = false
    this.timer = new THREE.Timer()

    container.innerHTML = ''
    container.classList.add('lia-three')
    container.style.height =
      typeof this.options.height === 'number' ? this.options.height + 'px' : this.options.height

    // --- renderer ---------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = !!this.options.shadows
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.localClippingEnabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)
    this.renderer = renderer

    const labelRenderer = new CSS2DRenderer()
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0'
    labelRenderer.domElement.style.left = '0'
    labelRenderer.domElement.style.pointerEvents = 'none'
    container.appendChild(labelRenderer.domElement)
    this.labelRenderer = labelRenderer

    // --- scene ------------------------------------------------------------
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(this.options.background)
    this.scene = scene

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8d8d7a, 1.6)
    hemi.userData.liaHelper = true
    scene.add(hemi)

    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(30, 50, 25)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.bias = -0.0005
    sun.shadow.normalBias = 0.04
    sun.userData.liaHelper = true
    sun.target.userData.liaHelper = true
    scene.add(sun)
    scene.add(sun.target)
    this.sun = sun

    this.ground = null
    this.grid = null
    this.setGround(this.options.ground)
    this.setGrid(this.options.grid)

    // --- cameras & controls -----------------------------------------------
    const { width, height } = this.size()
    this.perspective = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000)
    this.perspective.position.set(18, 14, 22)
    this.ortho = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 5000)
    this.camera = this.perspective

    const controls = new OrbitControls(this.camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.maxPolarAngle = Math.PI * 0.495
    controls.autoRotate = !!this.options.autoRotate
    controls.autoRotateSpeed = 1.5
    this.controls = controls

    // section plane: removes everything above its height
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6)
    this.section = null
    this.planMode = false

    // the builder adds into this group
    this.cutUniform = { value: 0 }
    this.content = new THREE.Group()
    this.content.name = 'content'
    scene.add(this.content)
    this.B = new Builder(this, this.content)

    this.initialCamera = this.perspective.position.clone()

    if (this.options.toolbar) this.buildToolbar()
    this.buildInfo()
    this.initPicking()

    // --- observers --------------------------------------------------------
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        this.visible = entries[entries.length - 1].isIntersecting
      })
      this.intersectionObserver.observe(container)
    }

    this.resize()
    this.loop = this.loop.bind(this)
    renderer.setAnimationLoop(this.loop)
  }

  /**
   * LiaScript sometimes replaces the container element by a new one with the same id
   * after the script has run. Move the view into the new element instead of disposing it.
   */
  reattach() {
    const id = this.container.id
    const el = id && document.getElementById(id)
    if (!el || el === this.container || el.querySelector('canvas')) return false
    el.innerHTML = ''
    el.className = this.container.className
    el.style.cssText = this.container.style.cssText
    while (this.container.firstChild) el.appendChild(this.container.firstChild)
    this.resizeObserver.disconnect()
    this.resizeObserver.observe(el)
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
      this.intersectionObserver.observe(el)
    }
    this.container = el
    this.resize()
    return true
  }

  size() {
    return {
      width: Math.max(this.container.clientWidth, 50),
      height: Math.max(this.container.clientHeight, 50),
    }
  }

  resize() {
    if (this.disposed) return
    const { width, height } = this.size()
    this.renderer.setSize(width, height)
    this.labelRenderer.setSize(width, height)
    this.perspective.aspect = width / height
    this.perspective.updateProjectionMatrix()
    this.updateOrtho()
    this.render()
  }

  loop(timestamp) {
    if (this.disposed) return
    if (!this.container.isConnected && !this.reattach()) {
      this.dispose()
      return
    }
    this.timer.update(timestamp)
    if (!this.visible && !document.fullscreenElement) return
    const dt = this.timer.getDelta()
    const t = this.timer.getElapsed()
    for (const fn of this.frameCallbacks) {
      try {
        fn(t, dt)
      } catch (e) {
        console.error(e)
        this.frameCallbacks = this.frameCallbacks.filter((f) => f !== fn)
      }
    }
    this.controls.update()
    this.render()
  }

  render() {
    if (this.disposed) return
    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
  }

  /** register a function that is called on every frame: fn(time, delta) */
  onFrame(fn) {
    this.frameCallbacks.push(fn)
    return fn
  }

  setGround(on, color, size) {
    if (this.ground) {
      this.scene.remove(this.ground)
      this.ground.geometry.dispose()
      this.ground.material.dispose()
      this.ground = null
    }
    this.options.ground = on
    if (color) this.options.groundColor = color
    if (size !== undefined) this.options.groundSize = size
    if (!on) return
    const s = this.options.groundSize || 400
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(s / 2, 64),
      new THREE.MeshStandardMaterial({ color: this.options.groundColor, roughness: 1 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    ground.userData.liaHelper = true
    ground.userData.liaGround = true
    this.scene.add(ground)
    this.ground = ground
  }

  setGrid(on, size = 40, divisions = 40) {
    if (this.grid) {
      this.scene.remove(this.grid)
      this.grid.dispose()
      this.grid = null
    }
    if (!on) return
    const grid = new THREE.GridHelper(size, divisions, 0x666666, 0xaaaaaa)
    grid.position.y = 0.005
    grid.userData.liaHelper = true
    this.scene.add(grid)
    this.grid = grid
  }

  setHeight(height) {
    this.options.height = height
    this.container.style.height = typeof height === 'number' ? height + 'px' : height
    this.resize()
  }

  setBackground(color) {
    this.scene.background = new THREE.Color(color)
  }

  /** bounding box of everything that is not a helper (ground, lights, grid) */
  bounds() {
    const box = new THREE.Box3()
    for (const child of this.scene.children) {
      if (child.userData.liaHelper || child.isLight) continue
      box.expandByObject(child)
    }
    if (box.isEmpty()) box.set(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 5, 5))
    return box
  }

  /** move the camera so that the whole model is visible */
  fit(force = false) {
    if (this.cameraLocked && !force) {
      this.updateShadow()
      return
    }
    const box = this.bounds()
    const center = box.getCenter(new THREE.Vector3())
    const dir = new THREE.Vector3(0.75, 0.6, 1).normalize()

    // smallest distance at which all corners of the bounding box are visible
    const cam = this.perspective
    const { width, height } = this.size()
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * 0.9
    const tanH = tanV * (width / height)
    const forward = dir.clone().negate()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
    const up = new THREE.Vector3().crossVectors(right, forward)
    let dist = 2
    const v = new THREE.Vector3()
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
      v.sub(center)
      const along = v.dot(dir)
      dist = Math.max(dist, along + Math.abs(v.dot(right)) / tanH, along + Math.abs(v.dot(up)) / tanV)
    }

    this.home = {
      position: center.clone().addScaledVector(dir, dist),
      target: center.clone(),
    }
    this.perspective.near = Math.max(dist / 1000, 0.05)
    this.perspective.far = dist * 50
    this.perspective.updateProjectionMatrix()
    this.resetView()
    this.updateShadow()
  }

  /** set camera and target explicitly, e.g. view({camera: [10, 8, 12], target: [0, 2, 0]}) */
  view({ camera, target } = {}) {
    if (camera) this.perspective.position.copy(toVec(camera))
    if (target) this.controls.target.copy(toVec(target))
    this.home = {
      position: this.perspective.position.clone(),
      target: this.controls.target.clone(),
    }
    this.cameraLocked = true
    this.controls.update()
    this.updateShadow()
  }

  resetView() {
    this.setPlanMode(false)
    if (!this.home) return
    this.perspective.position.copy(this.home.position)
    this.controls.target.copy(this.home.target)
    this.controls.update()
  }

  topView() {
    this.setPlanMode(false)
    const box = this.bounds()
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const dist = Math.max(size.x, size.z, 4) * 1.4
    this.perspective.position.set(center.x, box.max.y + dist, center.z + 0.001)
    this.controls.target.copy(center)
    this.controls.update()
  }

  updateShadow() {
    const box = this.bounds()
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const r = Math.max(size.length() / 2, 5) * 1.2
    const cam = this.sun.shadow.camera
    cam.left = -r
    cam.right = r
    cam.top = r
    cam.bottom = -r
    cam.near = 0.5
    cam.far = r * 4
    cam.updateProjectionMatrix()
    this.sun.target.position.copy(center)
    this.sun.position.copy(center).add(new THREE.Vector3(0.6, 1, 0.45).normalize().multiplyScalar(r * 2))
    if (this.ground && !this.options.groundSize) {
      const s = Math.max(size.x, size.z) * 4 + 40
      this.ground.scale.setScalar(s / 400)
      this.ground.position.x = center.x
      this.ground.position.z = center.z
    }
  }

  // --- plan (floor plan) & section --------------------------------------
  setSection(height) {
    const active = height !== null && height !== undefined
    const changed = active !== (this.section !== null && this.section !== undefined)
    this.section = active ? height : null
    if (active) this.clipPlane.constant = height
    this.cutUniform.value = active ? 1 : 0
    // local clipping planes (unlike renderer.clippingPlanes) also clip the shadows
    if (changed) this.applyClipping(active)
    if (this.sectionInput && height !== null && height !== undefined) {
      this.sectionInput.value = height
      this.sectionValue.textContent = Number(height).toFixed(1) + ' m'
    }
  }

  applyClipping(active) {
    const planes = active ? [this.clipPlane] : null
    this.scene.traverse((o) => {
      if (!o.isMesh || o.userData.liaHelper) return
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || m.clippingPlanes === planes) continue
        m.clippingPlanes = planes
        m.clipShadows = true
        m.needsUpdate = true
      }
    })
  }

  updateOrtho() {
    if (!this.ortho) return
    const { width, height } = this.size()
    const box = this.bounds()
    const size = box.getSize(new THREE.Vector3())
    const half = Math.max(size.x, size.z, 4) * 0.6
    const aspect = width / height
    this.ortho.left = -half * aspect
    this.ortho.right = half * aspect
    this.ortho.top = half
    this.ortho.bottom = -half
    this.ortho.updateProjectionMatrix()
  }

  setPlanMode(on) {
    if (on === this.planMode) return
    this.planMode = on
    const box = this.bounds()
    const center = box.getCenter(new THREE.Vector3())
    if (on) {
      this.savedView = {
        position: this.perspective.position.clone(),
        target: this.controls.target.clone(),
        section: this.section,
      }
      this.ortho.zoom = 1
      this.updateOrtho()
      // OrbitControls needs the default up vector, a tiny offset keeps north (-z) on top
      this.ortho.position.set(center.x, box.max.y + 50, center.z + 0.001)
      this.ortho.lookAt(center.x, 0, center.z)
      this.ortho.near = 0.1
      this.ortho.far = box.max.y + 200
      this.ortho.updateProjectionMatrix()
      this.camera = this.ortho
      this.controls.object = this.ortho
      this.controls.target.set(center.x, 0, center.z)
      this.controls.enableRotate = false
      this.sun.castShadow = false
      if (this.section === null || this.section === undefined) this.setSection(box.min.y + 1.2)
      this.showSlider(true)
    } else {
      this.camera = this.perspective
      this.controls.object = this.perspective
      this.controls.enableRotate = true
      this.sun.castShadow = !!this.options.shadows
      if (this.savedView) {
        this.perspective.position.copy(this.savedView.position)
        this.controls.target.copy(this.savedView.target)
        this.setSection(this.savedView.section)
        this.showSlider(this.savedView.section !== null && this.savedView.section !== undefined)
      }
    }
    this.controls.update()
    this.setButton('plan', on)
  }

  // --- toolbar ------------------------------------------------------------
  buildToolbar() {
    const bar = document.createElement('div')
    bar.className = 'lt-bar'
    this.buttons = {}
    const add = (key, icon, title, fn) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = icon
      b.title = title
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        fn()
      })
      bar.appendChild(b)
      this.buttons[key] = b
    }
    add('home', '⌂', 'Reset view', () => this.resetView())
    add('top', '⬒', 'Top view', () => this.topView())
    add('plan', '▦', 'Floor plan (orthographic, cut at 1.2 m)', () => this.setPlanMode(!this.planMode))
    add('section', '✂', 'Horizontal section', () => {
      const on = this.section === null || this.section === undefined
      if (on) {
        const box = this.bounds()
        this.setSection(box.min.y + (box.max.y - box.min.y) * 0.5)
      } else {
        this.setSection(null)
      }
      this.showSlider(on)
    })
    add('rotate', '⟳', 'Auto rotate', () => {
      this.controls.autoRotate = !this.controls.autoRotate
      this.setButton('rotate', this.controls.autoRotate)
    })
    add('fullscreen', '⛶', 'Fullscreen', () => {
      if (document.fullscreenElement) document.exitFullscreen()
      else if (this.container.requestFullscreen) this.container.requestFullscreen()
    })
    this.container.appendChild(bar)
    this.setButton('rotate', this.controls.autoRotate)

    const slider = document.createElement('label')
    slider.className = 'lt-slider'
    slider.innerHTML = '<span>✂</span><input type="range" step="0.05"><span class="lt-val"></span>'
    this.sectionInput = slider.querySelector('input')
    this.sectionValue = slider.querySelector('.lt-val')
    this.sectionInput.addEventListener('input', () => this.setSection(parseFloat(this.sectionInput.value)))
    slider.addEventListener('pointerdown', (e) => e.stopPropagation())
    this.container.appendChild(slider)
    this.slider = slider
  }

  setButton(key, on) {
    if (this.buttons && this.buttons[key]) this.buttons[key].classList.toggle('lt-on', !!on)
  }

  showSlider(on) {
    this.setButton('section', on)
    if (!this.slider) return
    this.slider.style.display = on ? 'flex' : 'none'
    if (on) {
      const box = this.bounds()
      this.sectionInput.min = (box.min.y - 0.05).toFixed(2)
      this.sectionInput.max = (box.max.y + 0.05).toFixed(2)
      if (this.section !== null && this.section !== undefined) this.setSection(this.section)
    }
  }

  // --- info boxes for clickable parts -------------------------------------
  buildInfo() {
    const info = document.createElement('div')
    info.className = 'lt-info'
    info.innerHTML = '<span class="lt-close">×</span><div class="lt-content"></div>'
    info.querySelector('.lt-close').addEventListener('click', () => this.showInfo(null))
    info.addEventListener('pointerdown', (e) => e.stopPropagation())
    this.container.appendChild(info)
    this.infoBox = info
  }

  showInfo(obj) {
    if (this.highlight) {
      this.scene.remove(this.highlight)
      this.highlight.geometry.dispose()
      this.highlight.material.dispose()
      this.highlight = null
    }
    if (!obj) {
      this.infoBox.style.display = 'none'
      return
    }
    const title = obj.userData.title || obj.name
    this.infoBox.querySelector('.lt-content').innerHTML =
      (title ? `<b>${title}</b>` : '') + `<div>${obj.userData.info}</div>`
    this.infoBox.style.display = 'block'
    this.highlight = new THREE.BoxHelper(obj, 0xff9800)
    this.highlight.userData.liaHelper = true
    this.scene.add(this.highlight)
  }

  initPicking() {
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const el = this.renderer.domElement
    let down = null

    const pick = (event) => {
      const rect = el.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, this.camera)
      const hits = raycaster.intersectObject(this.content, true)
      for (const hit of hits) {
        // ignore parts that are cut away by the section plane
        if (this.section !== null && this.section !== undefined && hit.point.y > this.section) continue
        let o = hit.object
        while (o && o !== this.content) {
          if (o.userData.info) return o
          o = o.parent
        }
        return null
      }
      return null
    }

    el.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY }
    })
    el.addEventListener('pointerup', (e) => {
      if (!down) return
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      down = null
      if (moved > 5) return
      this.showInfo(pick(e))
    })
    el.addEventListener('pointermove', (e) => {
      if (e.buttons) return
      el.style.cursor = pick(e) ? 'pointer' : ''
    })
  }

  // --- glTF ---------------------------------------------------------------
  load(url, { x = 0, y = 0, z = 0, scale = 1, rotation = 0, info, name } = {}) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        url,
        (gltf) => {
          const model = gltf.scene
          model.position.set(x, y, z)
          model.rotation.y = THREE.MathUtils.degToRad(rotation)
          model.scale.setScalar(scale)
          model.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true
              o.receiveShadow = true
            }
          })
          if (info) model.userData.info = info
          if (name) model.name = name
          this.content.add(model)
          if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(model)
            gltf.animations.forEach((clip) => mixer.clipAction(clip).play())
            this.onFrame((t, dt) => mixer.update(dt))
          }
          this.fit()
          resolve(model)
        },
        undefined,
        (err) => reject(err)
      )
    })
  }

  error(message) {
    const div = document.createElement('div')
    div.className = 'lt-error'
    div.textContent = message
    this.container.appendChild(div)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    if (this.intersectionObserver) this.intersectionObserver.disconnect()
    this.controls.dispose()
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
    })
    this.B.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    if (this.container.id && registry[this.container.id] === this) delete registry[this.container.id]
  }
}

export function create(container, options) {
  if (typeof container === 'string') container = document.getElementById(container)
  return new Viewer(container, options)
}
