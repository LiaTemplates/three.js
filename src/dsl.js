// A tiny line based language to describe buildings:
//
//   # comment
//   view   height=500 background=#ddeeff
//   house  x=0 z=0 w=10 d=8 floors=2 roof=hip info="My house"
//   wall   from=-8,6 to=8,6 h=1.2 windows=0
//   roof   gable x=20 w=6 d=4
//   group  x=30 rotation=45
//     tower r=1 h=10
//   end
//
// One line = one part: `command key=value key=value ...`
//   values: 3 | -1.5 | true | #ff0000 | red | "text with spaces"
//           1,2      -> [1, 2]          (lists, points)
//           1.2x2.1  -> [1.2, 2.1]      (sizes)
//           0,0;10,0;10,8 -> [[0,0], [10,0], [10,8]]  (point lists)
//           [3]      -> [3]             (a list with one element)
//   a bare word after the command is the main value (roof type, label text, model url)
//   or a flag (`wall ... arch` is the same as `arch=true`)

export class DSLError extends Error {
  constructor(message, line, column = 0) {
    super(message)
    this.name = 'DSLError'
    this.liaLine = line
    this.liaColumn = column
  }
}

const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i
const SIZE = /^[-+]?(\d+\.?\d*|\.\d+)(x[-+]?(\d+\.?\d*|\.\d+)){1,2}$/i

export function value(raw) {
  if (raw === undefined) return true
  if (/^".*"$|^'.*'$/s.test(raw)) return raw.slice(1, -1)
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (NUMBER.test(raw)) return Number(raw)
  if (/^\[.*\]$/.test(raw)) {
    const inner = raw.slice(1, -1).trim()
    return inner ? inner.split(',').map((v) => value(v.trim())) : []
  }
  if (raw.includes(';')) {
    return raw
      .split(';')
      .filter((v) => v.trim() !== '')
      .map((v) => value(v.trim()))
  }
  if (SIZE.test(raw)) return raw.split(/x/i).map(Number)
  if (raw.includes(',') && !/^(rgb|hsl)a?\(/i.test(raw)) return raw.split(',').map((v) => value(v.trim()))
  return raw
}

const TOKEN = /([A-Za-z_][\w]*)=("[^"]*"|'[^']*'|\S+)|("[^"]*"|'[^']*')|(\S+)/g

const MAIN = { roof: 'type', tree: 'type', label: 'text', model: 'url' }

export function parse(text) {
  const lines = text.split(/\r?\n/)
  const commands = []
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return
    TOKEN.lastIndex = 0
    let match
    let cmd = null
    const args = {}
    while ((match = TOKEN.exec(trimmed))) {
      const [, key, val, quoted, word] = match
      if (cmd === null) {
        if (!word) throw new DSLError(`line ${index + 1}: expected a command at the beginning`, index + 1)
        cmd = word
        continue
      }
      if (key) {
        args[key] = value(val)
      } else {
        const main = MAIN[cmd]
        const v = quoted !== undefined ? value(quoted) : value(word)
        if (main && args[main] === undefined) args[main] = v
        else if (typeof v === 'string') args[v] = true
      }
    }
    commands.push({ cmd, args, line: index + 1 })
  })
  return commands
}

const ALIASES = { floor: 'slab', door: 'wall', building: 'house', minaret: 'tower', text: 'label' }

/** run a building description on a viewer */
export function run(viewer, text) {
  const B = viewer.B
  const commands = parse(text)
  const loads = []
  let depth = 0

  for (const { cmd, args, line } of commands) {
    try {
      switch (cmd) {
        case 'view':
          applyView(viewer, args)
          break
        case 'ground':
          if (args.none || args.ground === false || args.show === false) viewer.setGround(false)
          else viewer.setGround(true, args.color, args.size)
          break
        case 'grid':
          viewer.setGrid(!(args.none || args.show === false), args.size, args.divisions)
          break
        case 'group':
          B.beginGroup(args)
          depth++
          break
        case 'end':
          if (depth === 0) throw new Error('"end" without "group"')
          B.endGroup()
          depth--
          break
        case 'model':
          if (!args.url) throw new Error('model needs an url, e.g. model url=house.glb')
          loads.push(viewer.load(args.url, args).catch((e) => console.error('model', args.url, e.message || e)))
          break
        default: {
          const name = ALIASES[cmd] || cmd
          if (name.startsWith('_') || typeof B[name] !== 'function' || !BUILD.includes(name)) {
            throw new Error(`unknown command "${cmd}"`)
          }
          B[name](args)
        }
      }
    } catch (e) {
      if (e instanceof DSLError) throw e
      throw new DSLError(`line ${line}: ${e.message}`, line)
    }
  }
  while (depth-- > 0) B.endGroup()
  return loads
}

const BUILD = [
  'box', 'cylinder', 'cone', 'sphere', 'slab', 'extrude',
  'wall', 'walls', 'house', 'roof', 'dome', 'tower',
  'column', 'columns', 'arcade', 'stairs', 'tree', 'label',
]

function applyView(viewer, a) {
  if (a.height) viewer.setHeight(a.height)
  if (a.background) viewer.setBackground(a.background)
  if (a.grid !== undefined) viewer.setGrid(a.grid !== false, a.gridSize, a.gridDivisions)
  if (a.ground !== undefined || a.groundColor) viewer.setGround(a.ground !== false, a.groundColor)
  if (a.shadows !== undefined) viewer.renderer.shadowMap.enabled = !!a.shadows
  if (a.autoRotate !== undefined) {
    viewer.controls.autoRotate = !!a.autoRotate
    viewer.setButton('rotate', !!a.autoRotate)
  }
  if (a.toolbar === false && viewer.container.querySelector('.lt-bar')) {
    viewer.container.querySelector('.lt-bar').style.display = 'none'
  }
  if (a.camera || a.target) viewer.view({ camera: a.camera, target: a.target })
}
