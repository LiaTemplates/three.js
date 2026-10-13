import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

// Coordinates: meters, x to the right, z towards the viewer, y up.
// For all parts `y` is the bottom (base) of the element (sphere: center).
// Common options: x, y, z, rotation (degrees around y), color, opacity, info, title, name

const rad = THREE.MathUtils.degToRad

const COLORS = {
  wall: '#f3ead8',
  roof: '#a0402a',
  slab: '#d9d4c7',
  stone: '#e8e2d0',
  door: '#7a4a2a',
  glass: '#a8d8f0',
  gold: '#d4af37',
  default: '#cccccc',
}

/** [x, z] from an array, an object {x, z} or a string "x,z" */
function point(p, fallback = [0, 0]) {
  if (p === undefined || p === null) return fallback
  if (Array.isArray(p)) return [Number(p[0]) || 0, Number(p[1]) || 0]
  if (typeof p === 'object') return [p.x || 0, p.z || 0]
  if (typeof p === 'string') return point(p.split(',').map(Number))
  return fallback
}

/** [w, h] from an array or a number */
function size2(s, fallback) {
  if (s === undefined || s === null) return fallback
  if (Array.isArray(s)) return [Number(s[0]), Number(s[1] ?? s[0])]
  return [Number(s), Number(s)]
}

/** evenly distributed positions on a length */
function distribute(count, length) {
  const list = []
  for (let i = 0; i < count; i++) list.push(((i + 0.5) * length) / count)
  return list
}

export class Builder {
  constructor(viewer, root) {
    this.viewer = viewer
    this.root = root
    this.parent = root
    this.stack = []
    this.materials = new Map()
    // 1 while a section is active: the inside of cut solids is drawn dark
    this.cutUniform = viewer.cutUniform || { value: 0 }
  }

  /** draws back faces (the inside of solids that are cut by the section plane) dark */
  patchCut(material) {
    const cut = this.cutUniform
    material.onBeforeCompile = (shader) => {
      shader.uniforms.liaCut = cut
      shader.fragmentShader =
        'uniform float liaCut;\n' +
        shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          '#include <dithering_fragment>\n  if (liaCut > 0.5 && !gl_FrontFacing) gl_FragColor.rgb = vec3(0.24, 0.22, 0.21);'
        )
    }
    material.customProgramCacheKey = () => 'lia-cut'
    return material
  }

  // --- materials & helpers -------------------------------------------------

  material(color = COLORS.default, opacity = 1) {
    if (color && (color.isMaterial || Array.isArray(color))) return color
    const key = String(color) + '|' + opacity
    if (!this.materials.has(key)) {
      this.materials.set(
        key,
        this.patchCut(
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide,
            transparent: opacity < 1,
            opacity,
            depthWrite: opacity >= 1,
          })
        )
      )
    }
    return this.materials.get(key)
  }

  glassMaterial() {
    if (!this.materials.has('glass')) {
      this.materials.set(
        'glass',
        new THREE.MeshStandardMaterial({
          color: COLORS.glass,
          roughness: 0.1,
          metalness: 0.2,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      )
    }
    return this.materials.get('glass')
  }

  /** create a mesh with shadows from a geometry */
  mesh(geometry, color, opacity = 1) {
    const m = new THREE.Mesh(geometry, this.material(color, opacity))
    m.castShadow = opacity >= 1
    m.receiveShadow = true
    return m
  }

  /** position, rotate, annotate an object and add it to the current group */
  finish(obj, o = {}) {
    obj.position.set(o.x || 0, o.y || 0, o.z || 0)
    if (o.rotation) obj.rotation.y = rad(o.rotation)
    if (o.name) obj.name = o.name
    if (o.title) obj.userData.title = o.title
    if (o.info) obj.userData.info = o.info
    this.parent.add(obj)
    return obj
  }

  /** add any three.js object, e.g. add(new THREE.Mesh(...), {x: 2, info: "..."}) */
  add(obj, o = {}) {
    if (o.x !== undefined || o.y !== undefined || o.z !== undefined) {
      obj.position.set(o.x || 0, o.y || 0, o.z || 0)
    }
    if (o.rotation) obj.rotation.y = rad(o.rotation)
    if (o.name) obj.name = o.name
    if (o.title) obj.userData.title = o.title
    if (o.info) obj.userData.info = o.info
    obj.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true
        c.receiveShadow = true
      }
    })
    this.parent.add(obj)
    return obj
  }

  // --- groups ----------------------------------------------------------------

  /** group(options, () => { ...parts relative to the group... }) */
  group(o = {}, fn) {
    if (typeof o === 'function') {
      fn = o
      o = {}
    }
    const g = this.beginGroup(o)
    try {
      if (fn) fn(g)
    } finally {
      this.endGroup()
    }
    return g
  }

  beginGroup(o = {}) {
    const g = new THREE.Group()
    this.finish(g, o)
    this.stack.push(this.parent)
    this.parent = g
    return g
  }

  endGroup() {
    if (this.stack.length) this.parent = this.stack.pop()
  }

  // --- primitives --------------------------------------------------------------

  box(o = {}) {
    let { w = 1, h = 1, d = 1 } = o
    if (o.size) [w, h, d] = [o.size[0], o.size[1] ?? o.size[0], o.size[2] ?? o.size[0]]
    const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0)
    return this.finish(this.mesh(geo, o.color, o.opacity), o)
  }

  cylinder(o = {}) {
    const { r = 0.5, h = 1, sides = 32 } = o
    const rTop = o.rTop ?? r
    const geo = new THREE.CylinderGeometry(rTop, r, h, sides).translate(0, h / 2, 0)
    return this.finish(this.mesh(geo, o.color, o.opacity), o)
  }

  cone(o = {}) {
    const { r = 0.5, h = 1, sides = 32 } = o
    const geo = new THREE.ConeGeometry(r, h, sides).translate(0, h / 2, 0)
    return this.finish(this.mesh(geo, o.color, o.opacity), o)
  }

  sphere(o = {}) {
    const { r = 0.5, segments = 32 } = o
    const geo = new THREE.SphereGeometry(r, segments, Math.max(8, segments / 2))
    return this.finish(this.mesh(geo, o.color, o.opacity), Object.assign({}, o, { y: o.y ?? r }))
  }

  /** floor plate / ceiling, top at y + t */
  slab(o = {}) {
    const { w = 10, d = 10, t = 0.2 } = o
    return this.box(Object.assign({ color: COLORS.slab }, o, { w, d, h: t, size: undefined }))
  }

  floor(o = {}) {
    return this.slab(o)
  }

  /** lifts an arbitrary footprint: points = [[x, z], ...] */
  extrude(o = {}) {
    const pts = (o.points || [[0, 0], [6, 0], [6, 4], [0, 4]]).map((p) => point(p))
    const h = o.h ?? 3
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
    for (const hole of o.holes || []) {
      shape.holes.push(new THREE.Path(hole.map((p) => point(p)).map(([x, z]) => new THREE.Vector2(x, -z))))
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 24 })
    geo.rotateX(-Math.PI / 2)
    return this.finish(this.mesh(geo, o.color ?? COLORS.wall, o.opacity), o)
  }

  // --- walls -------------------------------------------------------------------

  /** draws the outline of an opening into a THREE.Path or THREE.Shape */
  static outline(path, x0, x1, bottom, top, arch) {
    path.moveTo(x0, bottom)
    path.lineTo(x1, bottom)
    if (arch) {
      const r = (x1 - x0) / 2
      const spring = Math.max(bottom, top - r)
      path.lineTo(x1, spring)
      path.absarc((x0 + x1) / 2, spring, r, 0, Math.PI, false)
      path.lineTo(x0, bottom)
    } else {
      path.lineTo(x1, top)
      path.lineTo(x0, top)
      path.lineTo(x0, bottom)
    }
    return path
  }

  /**
   * wall({from: [x, z], to: [x, z], h, t, doors, windows, ...})
   *  - doors / windows: a number = count (evenly distributed) or a list of positions
   *    (distance of the opening center from `from`) or objects {at, w, h, bottom, arch}
   *  - doorSize / windowSize: [width, height], sill: height of the window bottom
   *  - arch: round arches for all openings
   */
  wall(o = {}) {
    const from = point(o.from, [0, 0])
    const to = point(o.to, [5, 0])
    const h = o.h ?? 3
    const t = o.t ?? 0.25
    const ext = o.extend ?? 0
    const dx = to[0] - from[0]
    const dz = to[1] - from[1]
    const len = Math.hypot(dx, dz)
    if (len < 1e-6) return null
    const L = len + 2 * ext

    const doorSize = size2(o.doorSize, [1.0, 2.1])
    const windowSize = size2(o.windowSize, [1.2, 1.2])
    const sill = o.sill ?? 0.9
    const arch = !!o.arch

    const openings = []
    const normalize = (list, kind, defaults) => {
      if (list === undefined || list === null || list === false) return []
      if (typeof list === 'number') list = list > 0 ? distribute(list, len) : []
      if (!Array.isArray(list)) list = [list]
      return list.map((it) => {
        const op = typeof it === 'object' ? Object.assign({}, it) : { at: Number(it) }
        return Object.assign({ kind, arch }, defaults, op)
      })
    }
    const doors = normalize(o.doors, 'door', { w: doorSize[0], h: doorSize[1], bottom: 0 })
    let windows = o.windows
    if (windows === undefined && o.windowSpacing) {
      windows = len >= Math.min(2.5, o.windowSpacing) ? Math.max(1, Math.floor(len / o.windowSpacing)) : 0
    }
    windows = normalize(windows, 'window', { w: windowSize[0], h: windowSize[1], bottom: sill })
    // windows that would overlap a door are dropped
    windows = windows.filter((win) => !doors.some((dr) => Math.abs(win.at - dr.at) < (win.w + dr.w) / 2 + 0.25))
    openings.push(...doors, ...windows, ...normalize(o.openings, 'hole', { w: 1, h: 2, bottom: 0 }))

    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(L, 0)
    shape.lineTo(L, h)
    shape.lineTo(0, h)
    shape.lineTo(0, 0)

    const extras = []
    for (const op of openings) {
      const at = (op.at ?? len / 2) + ext
      const x0 = Math.max(at - op.w / 2, 0.05)
      const x1 = Math.min(at + op.w / 2, L - 0.05)
      const bottom = Math.max(op.bottom, 0)
      const top = Math.min(bottom + op.h, h - 0.05)
      if (x1 - x0 < 0.05 || top - bottom < 0.05) continue
      shape.holes.push(Builder.outline(new THREE.Path(), x0, x1, bottom, top, op.arch))

      if (op.kind === 'window' && o.glass !== false) {
        const pane = new THREE.Mesh(
          new THREE.ShapeGeometry(Builder.outline(new THREE.Shape(), x0, x1, bottom, top, op.arch), 16),
          this.glassMaterial()
        )
        extras.push(pane)
      } else if (op.kind === 'door' && o.doorColor !== 'none' && o.doorColor !== false) {
        const leaf = this.mesh(
          new THREE.ExtrudeGeometry(Builder.outline(new THREE.Shape(), x0, x1, bottom, top, op.arch), {
            depth: 0.05,
            bevelEnabled: false,
            curveSegments: 16,
          }).translate(0, 0, -0.025),
          op.color ?? o.doorColor ?? COLORS.door
        )
        if (op.info) leaf.userData.info = op.info
        extras.push(leaf)
      }
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 16 })
    geo.translate(-ext, 0, -t / 2)
    const g = new THREE.Group()
    g.add(this.mesh(geo, o.color ?? COLORS.wall, o.opacity))
    for (const e of extras) {
      e.position.x -= ext
      g.add(e)
    }

    this.finish(g, Object.assign({}, o, { x: from[0] + (o.x || 0), z: from[1] + (o.z || 0), rotation: 0 }))
    g.rotation.y = Math.atan2(-dz, dx)
    return g
  }

  /**
   * walls({points: [[x, z], ...], closed, h, t, ...})
   * a polyline of walls; `segments: [{doors, windows}, ...]` sets openings per segment
   */
  walls(o = {}) {
    const pts = (o.points || []).map((p) => point(p))
    if (o.closed && pts.length > 2) pts.push(pts[0])
    const g = new THREE.Group()
    this.finish(g, { x: o.x, y: o.y, z: o.z, rotation: o.rotation, name: o.name, info: o.info, title: o.title })
    this.stack.push(this.parent)
    this.parent = g
    const t = o.t ?? 0.25
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = (o.segments && o.segments[i]) || {}
      const opts = Object.assign({}, o, { x: 0, y: 0, z: 0, name: undefined, info: undefined, title: undefined }, seg)
      this.wall(Object.assign(opts, { from: pts[i], to: pts[i + 1], extend: t / 2 }))
    }
    this.endGroup()
    return g
  }

  // --- buildings ---------------------------------------------------------------

  /**
   * house({x, z, w, d, h, floors, roof, ...}) - a complete house:
   * walls per floor with windows, a door, ceilings and a roof
   */
  house(o = {}) {
    const w = o.w ?? 10
    const d = o.d ?? 8
    const h = o.h ?? 3
    const t = o.t ?? 0.3
    const floors = Math.max(1, Math.round(o.floors ?? 1))
    const color = o.color ?? COLORS.wall
    const doorSide = o.door === undefined || o.door === true ? 'front' : o.door
    const spacing = o.windowSpacing ?? 3
    const common = {
      h,
      t,
      color,
      windowSize: o.windowSize ?? [1.2, 1.3],
      doorSize: o.doorSize ?? [1.1, 2.2],
      doorColor: o.doorColor,
      sill: o.sill ?? 0.9,
      arch: o.arch,
      glass: o.glass,
    }

    const sides = {
      front: { from: [-w / 2, d / 2 - t / 2], to: [w / 2, d / 2 - t / 2], len: w },
      back: { from: [w / 2, -d / 2 + t / 2], to: [-w / 2, -d / 2 + t / 2], len: w },
      left: { from: [-w / 2 + t / 2, -d / 2 + t], to: [-w / 2 + t / 2, d / 2 - t], len: d - 2 * t },
      right: { from: [w / 2 - t / 2, d / 2 - t], to: [w / 2 - t / 2, -d / 2 + t], len: d - 2 * t },
    }

    const windowCount = (side) => {
      if (o.windows === undefined) return undefined
      if (Array.isArray(o.windows)) return side === 'front' || side === 'back' ? o.windows : undefined
      if (side === 'front' || side === 'back') return o.windows
      return o.windows === 0 ? 0 : Math.max(1, Math.round((o.windows * d) / w))
    }

    return this.group(
      { x: o.x, y: o.y, z: o.z, rotation: o.rotation, name: o.name, info: o.info, title: o.title },
      () => {
        for (let f = 0; f < floors; f++) {
          const y = f * h
          for (const [name, side] of Object.entries(sides)) {
            const doors = f === 0 && doorSide === name ? [side.len / 2] : undefined
            this.wall(
              Object.assign({}, common, {
                from: side.from,
                to: side.to,
                y,
                doors,
                windows: windowCount(name),
                windowSpacing: spacing,
              })
            )
          }
          // floor plates
          if (f === 0) {
            this.slab({ w: w - 2 * t, d: d - 2 * t, t: 0.15, color: o.slabColor })
          } else {
            this.slab({ y: y - 0.2, w: w - 2 * t, d: d - 2 * t, t: 0.2, color: o.slabColor })
          }
        }
        const top = floors * h
        const roof = o.roof ?? 'gable'
        if (roof !== 'none' && roof !== false) {
          this.slab({ y: top, w, d, t: 0.2, color: o.slabColor })
          this.roof({
            type: roof,
            y: top + 0.2,
            w,
            d,
            h: o.roofHeight,
            overhang: o.overhang,
            color: o.roofColor,
            gableColor: color,
            ridge: o.ridge,
          })
        }
      }
    )
  }

  /**
   * roof({type: "gable" | "hip" | "pyramid" | "shed" | "flat" | "dome", w, d, h, overhang})
   * ridge: "x" or "z" (default: along the longer side)
   */
  roof(o = {}) {
    const type = o.type ?? 'gable'
    const ov = o.overhang ?? 0.4
    let w = (o.w ?? 10) + 2 * ov
    let d = (o.d ?? 8) + 2 * ov
    const color = o.color ?? COLORS.roof
    const ridge = o.ridge ?? (w >= d ? 'x' : 'z')
    const turn = ridge === 'x'
    if (turn) [w, d] = [d, w] // build with the ridge along z, then rotate
    const across = w
    const along = d
    let h = o.h ?? (type === 'shed' ? across * 0.25 : across * 0.4)
    let geo

    switch (type) {
      case 'gable':
      case 'shed': {
        const shape = new THREE.Shape()
        shape.moveTo(-across / 2, 0)
        shape.lineTo(across / 2, 0)
        if (type === 'gable') {
          shape.lineTo(0, h)
        } else {
          shape.lineTo(-across / 2, h)
        }
        shape.lineTo(-across / 2, 0)
        geo = new THREE.ExtrudeGeometry(shape, { depth: along, bevelEnabled: false })
        geo.translate(0, 0, -along / 2)
        const mats = [this.material(o.gableColor ?? color), this.material(color)]
        if (turn) geo.rotateY(Math.PI / 2)
        const m = new THREE.Mesh(geo, mats)
        m.castShadow = true
        m.receiveShadow = true
        return this.finish(m, o)
      }
      case 'hip':
      case 'pyramid': {
        const r = type === 'hip' ? Math.max(along - across, 0) : 0
        const A = [-across / 2, 0, -along / 2]
        const B = [across / 2, 0, -along / 2]
        const C = [across / 2, 0, along / 2]
        const D = [-across / 2, 0, along / 2]
        const R1 = [0, h, -r / 2]
        const R2 = [0, h, r / 2]
        const tris = [
          [A, R1, B], // back
          [C, R2, D], // front
          [B, R1, R2], [B, R2, C], // right
          [D, R2, R1], [D, R1, A], // left
          [A, B, C], [A, C, D], // bottom
        ]
        const pos = new Float32Array(tris.flat(2))
        geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
        geo.computeVertexNormals()
        if (turn) geo.rotateY(Math.PI / 2)
        return this.finish(this.mesh(geo, color), o)
      }
      case 'flat': {
        const t = o.h ?? 0.3
        geo = new THREE.BoxGeometry(across, t, along).translate(0, t / 2, 0)
        if (turn) geo.rotateY(Math.PI / 2)
        return this.finish(this.mesh(geo, color), o)
      }
      case 'dome':
        return this.dome(Object.assign({}, o, { r: Math.min(o.w ?? 10, o.d ?? 8) / 2, h: o.h, color }))
      default:
        throw new Error(`unknown roof type "${type}" (gable, hip, pyramid, shed, flat, dome)`)
    }
  }

  /** dome({r, h, drum, finial}) - a (stretched) hemisphere, optional drum below and finial on top */
  dome(o = {}) {
    const r = o.r ?? 3
    const h = o.h ?? r
    const sides = o.sides ?? 48
    const drum = o.drum ?? 0
    const color = o.color ?? COLORS.stone
    return this.group(
      { x: o.x, y: o.y, z: o.z, rotation: o.rotation, name: o.name, info: o.info, title: o.title },
      () => {
        if (drum > 0) {
          this.cylinder({ r: r * 1.02, h: drum, sides, color: o.drumColor ?? COLORS.wall })
        }
        const geo = new THREE.SphereGeometry(r, sides, Math.max(8, sides / 2), 0, Math.PI * 2, 0, Math.PI / 2)
        geo.scale(1, h / r, 1)
        this.finish(this.mesh(geo, color, o.opacity), { y: drum })
        if (o.finial) {
          const f = o.finial === true ? r * 0.4 : o.finial
          this.finial(drum + h, f, o.finialColor)
        }
      }
    )
  }

  finial(y, height, color = COLORS.gold) {
    this.cylinder({ y: y - 0.05, r: height * 0.04, h: height, sides: 8, color })
    this.sphere({ y: y + height * 0.45, r: height * 0.1, color })
    this.cone({ y: y + height * 0.8, r: height * 0.06, h: height * 0.25, sides: 8, color })
  }

  /** tower({r, h, sides, roof: "cone" | "dome" | "flat" | "none", balconies: [heights] or count}) */
  tower(o = {}) {
    const r = o.r ?? 1.2
    const h = o.h ?? 12
    const sides = o.sides ?? 16
    const color = o.color ?? COLORS.wall
    const roof = o.roof ?? 'cone'
    let balconies = o.balconies ?? []
    if (typeof balconies === 'number') {
      const n = balconies
      balconies = []
      for (let i = 1; i <= n; i++) balconies.push(h * (0.4 + (0.5 * i) / n))
    }
    if (!Array.isArray(balconies)) balconies = [balconies]
    const taper = o.taper ?? 1

    return this.group(
      { x: o.x, y: o.y, z: o.z, rotation: o.rotation, name: o.name, info: o.info, title: o.title },
      () => {
        this.cylinder({ r: r * 1.15, h: Math.min(1, h * 0.08), sides, color: o.baseColor ?? color })
        this.cylinder({ r, rTop: r * taper, h, sides, color })
        for (const b of balconies) {
          const rb = r * 1.4
          this.cylinder({ y: b, r: rb, rTop: rb, h: 0.25, sides, color: o.balconyColor ?? color })
          const rail = new THREE.CylinderGeometry(rb, rb, 0.9, sides, 1, true).translate(0, 0.45, 0)
          this.finish(this.mesh(rail, o.railColor ?? o.balconyColor ?? color), { y: b + 0.25 })
        }
        const rt = r * taper
        const roofColor = o.roofColor ?? (roof === 'dome' ? COLORS.stone : COLORS.roof)
        if (roof === 'cone') {
          const rh = o.roofHeight ?? rt * 3
          this.cylinder({ y: h, r: rt * 1.15, h: 0.25, sides, color })
          this.cone({ y: h + 0.25, r: rt * 1.1, h: rh, sides, color: roofColor })
          if (o.finial) this.finial(h + 0.25 + rh, o.finial === true ? rt : o.finial, o.finialColor)
        } else if (roof === 'dome') {
          this.dome({ y: h, r: rt, h: o.roofHeight ?? rt, sides: 32, color: roofColor, finial: o.finial, finialColor: o.finialColor })
        } else if (roof === 'flat') {
          this.cylinder({ y: h, r: rt * 1.15, h: 0.3, sides, color: roofColor })
        }
      }
    )
  }

  /** column({r, h, base, capital}) */
  column(o = {}) {
    const r = o.r ?? 0.25
    const h = o.h ?? 3
    const color = o.color ?? COLORS.stone
    return this.group(
      { x: o.x, y: o.y, z: o.z, rotation: o.rotation, name: o.name, info: o.info, title: o.title },
      () => {
        const cap = o.capital === false ? 0 : Math.min(0.25, h * 0.08)
        const base = o.base === false ? 0 : Math.min(0.25, h * 0.08)
        if (base) this.box({ w: r * 2.8, d: r * 2.8, h: base, color })
        this.cylinder({ y: base, r, rTop: r * 0.9, h: h - base - cap, sides: 24, color })
        if (cap) this.box({ y: h - cap, w: r * 2.8, d: r * 2.8, h: cap, color })
      }
    )
  }

  /** columns({from: [x, z], to: [x, z], count}) - a row of columns */
  columns(o = {}) {
    const from = point(o.from, [0, 0])
    const to = point(o.to, [10, 0])
    const count = Math.max(1, Math.round(o.count ?? 5))
    return this.group({ x: o.x, y: o.y, z: o.z, name: o.name, info: o.info, title: o.title }, () => {
      for (let i = 0; i < count; i++) {
        const f = count === 1 ? 0.5 : i / (count - 1)
        this.column(
          Object.assign({}, o, {
            x: from[0] + (to[0] - from[0]) * f,
            y: 0,
            z: from[1] + (to[1] - from[1]) * f,
            name: undefined,
            info: undefined,
            title: undefined,
          })
        )
      }
    })
  }

  /** arcade({from, to, count, h, t, archWidth, archHeight}) - a wall with round arches */
  arcade(o = {}) {
    const from = point(o.from, [0, 0])
    const to = point(o.to, [10, 0])
    const len = Math.hypot(to[0] - from[0], to[1] - from[1])
    const count = Math.max(1, Math.round(o.count ?? 5))
    const h = o.h ?? 4
    const spacing = len / count
    const aw = Math.min(o.archWidth ?? spacing * 0.72, spacing - 0.1)
    const ah = Math.min(o.archHeight ?? h * 0.78, h - 0.1)
    const openings = distribute(count, len).map((at) => ({ at, w: aw, h: ah, bottom: 0, arch: true, kind: 'hole' }))
    return this.wall(
      Object.assign({ t: 0.5, color: COLORS.stone }, o, {
        from,
        to,
        h,
        doors: undefined,
        windows: undefined,
        windowSpacing: undefined,
        openings,
      })
    )
  }

  /** stairs({w, steps, rise, run}) - goes up towards -z (use rotation to turn it) */
  stairs(o = {}) {
    const w = o.w ?? 1.2
    const steps = Math.max(1, Math.round(o.steps ?? 12))
    const rise = o.rise ?? 0.17
    const run = o.run ?? 0.28
    const color = o.color ?? COLORS.slab
    return this.group(
      { x: o.x, y: o.y, z: o.z, rotation: o.rotation, name: o.name, info: o.info, title: o.title },
      () => {
        for (let i = 0; i < steps; i++) {
          this.box({ z: -i * run - run / 2, w, d: run, h: (i + 1) * rise, color })
        }
      }
    )
  }

  /** tree({h, type: "round" | "conifer"}) */
  tree(o = {}) {
    const h = o.h ?? 5
    const type = o.type ?? 'round'
    const color = o.color ?? (type === 'conifer' ? '#2f6b3a' : '#4c8c3f')
    return this.group(
      { x: o.x, y: o.y, z: o.z, rotation: o.rotation, name: o.name, info: o.info, title: o.title },
      () => {
        this.cylinder({ r: h * 0.04, rTop: h * 0.03, h: h * 0.45, sides: 8, color: o.trunkColor ?? '#7a5230' })
        if (type === 'conifer') {
          this.cone({ y: h * 0.2, r: h * 0.25, h: h * 0.5, sides: 12, color })
          this.cone({ y: h * 0.45, r: h * 0.19, h: h * 0.45, sides: 12, color })
          this.cone({ y: h * 0.7, r: h * 0.12, h: h * 0.3, sides: 12, color })
        } else {
          const crown = new THREE.IcosahedronGeometry(h * 0.3, 1)
          this.finish(this.mesh(crown, color), { y: h * 0.65 })
        }
      }
    )
  }

  /** label({text, x, y, z}) - a text that always faces the camera */
  label(o = {}) {
    const div = document.createElement('div')
    div.className = 'lt-label'
    div.innerHTML = o.text ?? ''
    if (o.color) div.style.color = o.color
    if (o.background) div.style.background = o.background
    const obj = new CSS2DObject(div)
    return this.finish(obj, o)
  }

  dispose() {
    for (const m of this.materials.values()) m.dispose()
    this.materials.clear()
  }
}

/** names of the builder functions that are available as globals in code blocks */
Builder.API = [
  'box', 'cylinder', 'cone', 'sphere', 'slab', 'floor', 'extrude',
  'wall', 'walls', 'house', 'roof', 'dome', 'tower',
  'column', 'columns', 'arcade', 'stairs', 'tree', 'label',
  'group', 'add', 'mesh', 'material',
]
