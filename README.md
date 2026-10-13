<!--
author:   André Dietrich
email:    LiaScript@web.de
version:  0.1.0
language: en
narrator: US English Female
comment:  Interactive 3D scenes and buildings with three.js in LiaScript – write plain
          JavaScript or describe a building line by line (houses, walls, roofs, domes,
          towers, arcades …) and explore it with floor plan and section views.

script:   dist/index.js

attribute: [three.js](https://threejs.org) by Ricardo Cabello (mrdoob) and contributors
           is licensed under [MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE)

@THREE.autorun
<script modify="false">
// executes the code block once, when the slide is shown
let tries = 0
function autorun() {
  let el = document.getElementById("three-@0")
  if (!el) {
    if (tries++ < 50) setTimeout(autorun, 50)
    return
  }
  if (el.querySelector("canvas")) return
  while (el && !(el.classList && el.classList.contains("lia-code--block"))) {
    el = el.previousElementSibling
  }
  const button = el && el.querySelector("button[aria-keyshortcuts]")
  if (button) button.click()
}
setTimeout(autorun, 50)
"LIA: stop"
</script>
@end

@THREE.eval: @THREE.eval_(@uid)

@THREE.eval_
<script>
if (window.LiaThree) {
  try {
    LiaThree.exec("three-@0", `@'input`, "js", send)
  } catch (e) {
    if (e.liaLine && typeof LiaError !== "undefined") {
      let err = new LiaError(e.message, 1)
      err.add_detail(0, e.message, "error", e.liaLine - 1, e.liaColumn || 0)
      throw err
    }
    console.error(e.message)
    "LIA: stop"
  }
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    try {
      if (LiaThree.exec("three-@0", `@'input`, "js", send) !== "LIA: wait") send.lia("LIA: stop")
    } catch (e) {
      console.error(e.message)
      send.lia("LIA: stop")
    }
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>

@THREE.autorun(@0)
@end


@THREE.building: @THREE.building_(@uid)

@THREE.building_
<script>
if (window.LiaThree) {
  try {
    LiaThree.exec("three-@0", `@'input`, "building", send)
  } catch (e) {
    if (e.liaLine && typeof LiaError !== "undefined") {
      let err = new LiaError(e.message, 1)
      err.add_detail(0, e.message, "error", e.liaLine - 1, 0)
      throw err
    }
    console.error(e.message)
    "LIA: stop"
  }
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    try {
      if (LiaThree.exec("three-@0", `@'input`, "building", send) !== "LIA: wait") send.lia("LIA: stop")
    } catch (e) {
      console.error(e.message)
      send.lia("LIA: stop")
    }
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>

@THREE.autorun(@0)
@end


@THREE.scene: @THREE.scene_(@uid,```@0```)

@THREE.scene_
<script modify="false">
function run() {
  try {
    return LiaThree.exec("three-@0", `@'1`, "js", send, true)
  } catch (e) {
    console.error(e.message)
    return "LIA: stop"
  }
}
if (window.LiaThree) {
  run()
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    if (run() !== "LIA: wait") send.lia("LIA: stop")
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>
@end


@THREE.scene.building: @THREE.scene.building_(@uid,```@0```)

@THREE.scene.building_
<script modify="false">
function run() {
  try {
    return LiaThree.exec("three-@0", `@'1`, "building", send, true)
  } catch (e) {
    console.error(e.message)
    return "LIA: stop"
  }
}
if (window.LiaThree) {
  run()
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    if (run() !== "LIA: wait") send.lia("LIA: stop")
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>
@end


@THREE.gltf: @THREE.gltf_(@uid,@0)

@THREE.gltf_
<script modify="false">
function run() {
  try {
    return LiaThree.exec("three-@0", "@1", "gltf", send, true)
  } catch (e) {
    console.error(e.message)
    return "LIA: stop"
  }
}
if (window.LiaThree) {
  run()
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    if (run() !== "LIA: wait") send.lia("LIA: stop")
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>
@end
-->

# three.js – Template

                         --{{0}}--
This template brings [three.js](https://threejs.org) to LiaScript. You can write
plain three.js code, or – without any programming – describe buildings line by
line and explore them interactively in 3D, as a floor plan or as a section.

__Try it on LiaScript:__

https://liascript.github.io/course/?https://raw.githubusercontent.com/LiaTemplates/three.js/main/README.md

__See the project on Github:__

https://github.com/LiaTemplates/three.js

                         --{{1}}--
There are three ways to use this template. The easiest one is to import it into
your course header, either a fixed version or the latest one.

                           {{1}}
1. Load the latest macros via (this might cause breaking changes)

   `import: https://raw.githubusercontent.com/LiaTemplates/three.js/main/README.md`

   or the current version 0.1.0 via:

   `import: https://raw.githubusercontent.com/LiaTemplates/three.js/0.1.0/README.md`

2. __Copy the definitions into your Project__

3. Clone this repository on GitHub

## Quick start

A complete house in one line – add `@THREE.building` below a code block that
describes the building. The code stays editable, change something and press run:

```text
house floors=2 roof=hip
```
@THREE.building

Use the mouse (or your fingers) to look around:

* __left drag__ – rotate, __right drag__ – move, __wheel__ – zoom
* the buttons in the upper right corner:

  | Button | Function                                                               |
  | :----: | ---------------------------------------------------------------------- |
  |   ⌂    | reset the view                                                         |
  |   ⬒    | look from the top                                                      |
  |   ▦    | __floor plan__: orthographic view from the top, cut at 1.2 m height    |
  |   ✂    | __section__: cut away everything above the height of the slider        |
  |   ⟳    | rotate automatically                                                   |
  |   ⛶    | fullscreen                                                             |

* parts with an `info` text can be clicked
* the view can be resized at its lower right corner

## `@THREE.building`

                         --{{0}}--
Every line describes one part of the building. The first word is the command,
followed by any number of key=value pairs. Lines starting with a hash are
comments.

``` text
# command  key=value key=value ...
view   height=480
house  x=-8 w=10 d=8 floors=2 roof=gable roofColor=#8b3a2b info="A family house"
house  x=8 w=8 d=8 floors=1 roof=pyramid color=#f6d7b0 windows=1
wall   from=-14,7 to=14,7 h=1.2 t=0.2 color=#999 doors=[14] doorColor=none
tree   x=-16 z=4 h=7
tree   conifer x=15 z=-4 h=8
label  "Hello three.js" x=0 y=9 z=0
```
@THREE.building

__Values:__

| Value               | Example                       | Meaning                                       |
| ------------------- | ----------------------------- | --------------------------------------------- |
| number              | `h=3`, `x=-2.5`               | in meters                                     |
| color               | `color=#a33`, `color=red`     | any CSS color                                 |
| text                | `info="A text with spaces"`   | may contain HTML                              |
| list / point        | `from=0,5`, `doors=2,6`       | comma separated                               |
| size                | `windowSize=1.2x1.5`          | width × height                                |
| point list          | `points=0,0;10,0;10,8`        | semicolon separated points                    |
| list with one value | `doors=[3]`                   | a door at position 3 (instead of one door)    |
| flag                | `arch`, `finial`              | the same as `arch=true`                       |

The coordinate system: `x` goes to the right, `z` towards the viewer and `y` up.
`y` always describes the __bottom__ of a part. All parts accept `x`, `y`, `z`,
`rotation` (in degrees), `color`, `info`, `title` and `name`.

## Roofs & Houses

`house` creates walls for every floor, windows, a door, ceilings and a roof.
`roof` can also be used on its own.

```text
view background=#e8f0f8
house  x=-14 roof=gable   info="<b>gable roof</b> – Satteldach"
house  x=0   roof=hip     info="<b>hip roof</b> – Walmdach"
house  x=14  roof=pyramid w=8 d=8 info="<b>pyramid roof</b> – Zeltdach"
house  x=-14 z=16 roof=shed info="<b>shed roof</b> – Pultdach"
house  x=0   z=16 roof=flat floors=3 windowSpacing=2.5 info="<b>flat roof</b> – Flachdach"
house  x=14  z=16 roof=dome w=8 d=8 color=#fff3e0 roofColor=#5c8ea8 info="<b>dome</b> – Kuppel"
```
@THREE.building

<details>
<summary>**`house` parameters**</summary>

| Parameter       | Default    | Meaning                                                       |
| --------------- | ---------- | ------------------------------------------------------------- |
| `w`, `d`        | 10, 8      | width (x) and depth (z)                                       |
| `h`             | 3          | height of one floor                                           |
| `floors`        | 1          | number of floors                                              |
| `t`             | 0.3        | wall thickness                                                |
| `roof`          | gable      | gable, hip, pyramid, shed, flat, dome, none                   |
| `roofHeight`    | auto       | height of the roof                                            |
| `roofColor`     | #a0402a    |                                                               |
| `overhang`      | 0.4        | roof overhang                                                 |
| `ridge`         | auto       | `x` or `z`, direction of the ridge                            |
| `door`          | front      | front, back, left, right or `false`                           |
| `doorSize`      | 1.1x2.2    | width × height                                                |
| `windows`       | auto       | number of windows at the front and back (0 = none)            |
| `windowSpacing` | 3          | used if `windows` is not set                                  |
| `windowSize`    | 1.2x1.3    |                                                               |
| `sill`          | 0.9        | height of the window sill                                     |
| `arch`          | false      | round arches for windows and doors                            |

</details>

<details>
<summary>**`roof` parameters**</summary>

`roof type x y z w d h overhang ridge color gableColor` – the type can also be
written as the first word: `roof hip x=3 w=6 d=4 y=3`.

</details>

## Walls, doors & windows

`wall` draws a wall from one point to another. Doors and windows are real
openings, so you can look through them. A number is the __count__ of openings,
a list gives their __positions__ (distance from the start point).

```text
view   height=420
slab   w=12 d=8 t=0.1
wall   from=-6,-4 to=6,-4 windows=3 info="3 windows, evenly distributed"
wall   from=-6,4 to=6,4 doors=1 windows=2,10 info="one door, windows at 2 m and 10 m"
wall   from=-6,-4 to=-6,4 windows=1 windowSize=1.6x2 arch info="an arched window"
wall   from=6,-4 to=6,4 doors=[4] doorSize=1.8x2.6 arch doorColor=#2f5d50
```
@THREE.building

With `walls` a whole polyline is drawn, `extrude` lifts any footprint up:

```text
walls   points=0,0;14,0;14,6;6,6;6,12;0,12 closed h=3 windowSpacing=2.5 color=#e0e7ef
slab    x=7 z=3 w=14 d=6 y=3 t=0.2
slab    x=3 z=9 w=6 d=6 y=3 t=0.2
extrude points=20,0;30,0;30,4;24,10;20,10 h=7 color=#c5d6c3 info="any footprint can be extruded"
```
@THREE.building

## Floor plans & sections

Draw the walls of an apartment and press ▦ for the floor plan or ✂ for a
section. Every part with `info` can be clicked.

```text
view   height=520
slab   w=14 d=10 t=0.1 color=#cbbfae
# outer walls
walls  points=-7,-5;7,-5;7,5;-7,5 closed h=2.8 t=0.3 windowSpacing=3 color=#f4f1ea
# inner walls with doors
wall   from=-1,-5 to=-1,5 h=2.8 t=0.12 doors=[2.5,7.5] doorColor=none
wall   from=-7,0 to=-1,0 h=2.8 t=0.12 doors=[3] doorColor=none
wall   from=-1,1 to=7,1 h=2.8 t=0.12 doors=[4] doorColor=none
# furniture
box    x=3 z=-2 w=3.2 d=1 h=0.8 color=#7d9cb8 info="Sofa"
box    x=-4 z=-2.5 w=2 d=1.6 h=0.5 color=#d9c2a7 info="Bed" title="Bedroom"
box    x=-4 z=2.5 w=1.4 d=0.7 h=0.9 color=#ddd info="Bathroom"
cylinder x=4 z=3 r=0.7 h=0.75 color=#a07850 info="Dining table"
label  "Living room" x=3 y=1 z=-2
label  "Bedroom" x=-4 y=1 z=-2.5
label  "Bath" x=-4 y=1 z=2.5
label  "Kitchen" x=4 y=1 z=3
```
@THREE.building

## A mosque

The building described in [info.md](info.md), completely made from simple parts:
a prayer hall with a central dome, two minarets with balconies, a courtyard with
arcades and a fountain, and the mihrab in the qibla wall.

```text
view   height=560 background=#e3edf6
# platform & courtyard
box    z=3 w=34 d=40 h=0.4 color=#d6ccbc
slab   z=12 y=0.4 w=23.4 d=17.4 t=0.03 color=#efe8dc

# prayer hall
walls  points=-12,3;-12,-15;12,-15;12,3 y=0.4 h=8 t=0.6 windowSpacing=3.6 windowSize=1.4x2.8 sill=2.2 arch color=#f1e7d3 info="Prayer hall"
wall   from=-12.3,3 to=12.3,3 y=0.4 h=8 t=0.6 doors=6.3,12.3,18.3 doorSize=2x4.2 arch doorColor=#6b3e26 windows=0 color=#f1e7d3 info="Entrance front with three arched doors"
slab   z=-6 y=8.4 w=24.6 d=18.6 t=0.4 color=#e6dcc8

# domes
dome   z=-6 y=8.8 r=6 drum=2 finial=3 color=#3f8f9f drumColor=#f1e7d3 info="Main dome above the prayer hall"
dome   x=-8.5 z=-12 y=8.8 r=1.8 finial color=#3f8f9f
dome   x=8.5 z=-12 y=8.8 r=1.8 finial color=#3f8f9f
dome   x=-8.5 z=0 y=8.8 r=1.8 finial color=#3f8f9f
dome   x=8.5 z=0 y=8.8 r=1.8 finial color=#3f8f9f

# minarets
tower  x=-14 z=3.5 y=0.4 r=1.1 h=22 sides=12 balconies=2 roof=cone roofHeight=4 roofColor=#3f8f9f finial color=#f1e7d3 info="Minaret with two balconies"
tower  x=14 z=3.5 y=0.4 r=1.1 h=22 sides=12 balconies=2 roof=cone roofHeight=4 roofColor=#3f8f9f finial color=#f1e7d3 info="Minaret with two balconies"

# mihrab & minbar
box    z=-15.9 y=0.4 w=3.4 d=1.2 h=5.5 color=#f1e7d3
arcade from=-1.6,-14.6 to=1.6,-14.6 y=0.4 count=1 h=5 t=0.2 archWidth=2.2 archHeight=4 color=#c9a227 info="The <b>mihrab</b> shows the direction of prayer (qibla)."
stairs x=3.2 z=-12 y=0.4 w=0.9 steps=9 color=#8b5a3c info="Minbar – the pulpit"

# courtyard arcades
arcade from=-11.7,3.3 to=-11.7,20.7 y=0.4 count=6 h=5 t=0.6 color=#ece2cf info="Arcade (riwaq) around the courtyard"
arcade from=11.7,3.3 to=11.7,20.7 y=0.4 count=6 h=5 t=0.6 color=#ece2cf info="Arcade (riwaq) around the courtyard"
arcade from=-12,21 to=12,21 y=0.4 count=7 h=5 t=0.6 color=#ece2cf info="Courtyard gate"

# fountain
cylinder z=12 y=0.4 r=2.2 h=0.5 sides=8 color=#d6ccbc info="Fountain for the ritual ablution"
cylinder z=12 y=0.45 r=1.95 h=0.5 sides=8 color=#5fa8d3
cylinder z=12 y=0.4 r=0.2 h=1.8 color=#d6ccbc
dome     z=12 y=2.2 r=0.5 color=#3f8f9f

tree x=-18 z=-10 h=7
tree x=18 z=-10 h=7
tree x=-18 z=18 h=6
tree x=18 z=18 h=6
```
@THREE.building

## `@THREE.eval` – JavaScript

                         --{{0}}--
For more control, write JavaScript. All building commands are available as
functions that get an object with the same parameters as in the line based
description.

```js
// a small street, generated with plain JavaScript
const roofs = ['gable', 'hip', 'flat', 'pyramid']

for (let i = 0; i < 6; i++) {
  house({
    x: i * 12 - 30, z: -9, w: 9, d: 8,
    floors: 1 + (i % 3),
    roof: roofs[i % 4],
    color: `hsl(${i * 50}, 45%, 85%)`,
    info: `House number ${2 * i + 1}`
  })
  house({
    x: i * 12 - 30, z: 13, w: 8, d: 8, rotation: 180,
    floors: 1 + ((i + 1) % 2),
    roof: roofs[(i + 1) % 4],
    color: `hsl(${200 + i * 20}, 30%, 88%)`,
    info: `House number ${2 * i + 2}`
  })
  tree({ x: i * 12 - 24, z: -1, h: 5 })
}

box({ x: -1, z: 2, w: 80, d: 5, h: 0.05, color: '#555', info: 'Main street' })
```
@THREE.eval

<details>
<summary>**Available variables & functions**</summary>

| Name                                                  | Meaning                                                |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `THREE`                                               | three.js (incl. `OrbitControls`, `GLTFLoader`, …)       |
| `scene`, `camera`, `renderer`, `controls`             | the three.js objects of this view                       |
| `viewer`                                              | `viewer.view({camera, target})`, `viewer.fit()`, `viewer.setHeight(500)`, `viewer.setBackground(color)`, `viewer.setGround(bool)`, `viewer.setGrid(bool)`, `viewer.setSection(h)`, `viewer.setPlanMode(bool)`, `viewer.load(url, options)` |
| `onFrame((time, delta) => …)`                         | called for every frame, for animations                  |
| `box`, `cylinder`, `cone`, `sphere`, `slab`, `extrude` | primitives                                             |
| `wall`, `walls`, `house`, `roof`, `dome`, `tower`      | building parts                                         |
| `column`, `columns`, `arcade`, `stairs`, `tree`, `label` | more parts                                           |
| `group(options, () => {…})`                           | moves / rotates all parts inside together               |
| `add(object, options)`                                | adds any three.js object (with `info`, position, …)     |
| `material(color, opacity)`                            | a cached standard material                              |

Every function returns the created three.js object.

</details>

## Animations

`onFrame` registers a function that is called for every frame:

```js
const knot = add(new THREE.Mesh(
  new THREE.TorusKnotGeometry(2, 0.6, 160, 24),
  new THREE.MeshStandardMaterial({ color: 'tomato', metalness: 0.3, roughness: 0.4 })
), { y: 4, info: 'A torus knot – pure three.js' })

const ring = group({ y: 0.01 }, () => {
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2
    column({ x: Math.cos(a) * 8, z: Math.sin(a) * 8, h: 4 + Math.sin(a * 3) })
  }
})

onFrame((time) => {
  knot.rotation.x = time * 0.5
  knot.rotation.y = time * 0.8
  ring.rotation.y = -time * 0.1
})
```
@THREE.eval

## Groups & rotation

`group` moves and rotates everything inside. In the line based description it is
closed with `end`:

```text
group x=0 z=0 rotation=30
  house w=8 d=6 roof=gable
  tower x=6 z=-4 r=0.8 h=10 roof=cone
end

group x=18 z=0 rotation=-20
  house w=6 d=6 roof=pyramid floors=2
  stairs x=-2 z=5 steps=6
end
```
@THREE.building

## Hidden code: `@THREE.scene`

                         --{{0}}--
If you only want to show the result, put the macro into the head of the code
block. The code is then hidden, and only the 3D view is shown.

```` markdown
```text @THREE.scene.building
house floors=3 roof=hip w=12
tower x=10 r=1.5 h=16 roof=dome balconies=1
```
````

```text @THREE.scene.building
house floors=3 roof=hip w=12
tower x=10 r=1.5 h=16 roof=dome balconies=1
```

The same works with JavaScript and `@THREE.scene`:

```` markdown
```js @THREE.scene
viewer.setGrid(true)
viewer.setGround(false)
for (let i = 0; i < 5; i++) {
  box({ x: i * 2 - 4, h: i + 1, color: `hsl(${i * 60}, 70%, 60%)` })
}
```
````

```js @THREE.scene
viewer.setGrid(true)
viewer.setGround(false)
for (let i = 0; i < 5; i++) {
  box({ x: i * 2 - 4, h: i + 1, color: `hsl(${i * 60}, 70%, 60%)` })
}
```

## glTF models: `@THREE.gltf`

glTF / GLB models can be loaded with `@[THREE.gltf](url)`:

``` markdown
@[THREE.gltf](https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb)
```

@[THREE.gltf](https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb)

Inside a building description use `model url=… x=… scale=…`, in JavaScript
`await viewer.load(url, {x, y, z, scale, rotation, info})`.

## Reference

<!-- data-type="none" -->
| Command    | Parameters (besides `x y z rotation color info title name`)                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| `box`      | `w h d` or `size=1x2x3`                                                                                      |
| `cylinder` | `r rTop h sides`                                                                                             |
| `cone`     | `r h sides`                                                                                                  |
| `sphere`   | `r` (`y` = center, default `r`)                                                                              |
| `slab`     | `w d t` – floor plate, alias `floor`                                                                         |
| `extrude`  | `points h` – lifts a footprint                                                                               |
| `wall`     | `from to h t doors windows doorSize windowSize sill arch doorColor glass openings`                            |
| `walls`    | `points closed` + all `wall` parameters                                                                      |
| `house`    | `w d h floors t roof roofHeight roofColor overhang ridge door doorSize windows windowSpacing windowSize sill arch slabColor` |
| `roof`     | `type w d h overhang ridge gableColor` – type: gable, hip, pyramid, shed, flat, dome                         |
| `dome`     | `r h drum drumColor finial finialColor sides`                                                                |
| `tower`    | `r h sides taper roof roofHeight roofColor balconies balconyColor finial`                                    |
| `column`   | `r h base capital`                                                                                           |
| `columns`  | `from to count` + `column` parameters                                                                        |
| `arcade`   | `from to count h t archWidth archHeight`                                                                     |
| `stairs`   | `w steps rise run` – goes up towards -z                                                                      |
| `tree`     | `h type` (round, conifer) `trunkColor`                                                                       |
| `label`    | `text background`                                                                                            |
| `group`    | … `end`                                                                                                      |
| `model`    | `url scale`                                                                                                  |
| `view`     | `height background grid ground groundColor shadows autoRotate camera target toolbar`                         |
| `ground`   | `color size` or `ground none`                                                                                |

## Implementation

The three.js library, the viewer and all building functions are bundled with
[Parcel](https://parceljs.org) into `dist/index.js`:

```bash
npm install
npm run build
```

| File              | Content                                                    |
| ----------------- | ---------------------------------------------------------- |
| `src/index.js`    | entry point, `window.LiaThree`, runs code for the macros   |
| `src/viewer.js`   | scene, camera, light, toolbar, floor plan & section        |
| `src/builder.js`  | all building parts                                         |
| `src/dsl.js`      | the line based building description                        |

The macros only call `LiaThree.exec(id, code, mode, send)`:

```html
script:   dist/index.js

@THREE.autorun
<script modify="false">
// executes the code block once, when the slide is shown
let tries = 0
function autorun() {
  let el = document.getElementById("three-@0")
  if (!el) {
    if (tries++ < 50) setTimeout(autorun, 50)
    return
  }
  if (el.querySelector("canvas")) return
  while (el && !(el.classList && el.classList.contains("lia-code--block"))) {
    el = el.previousElementSibling
  }
  const button = el && el.querySelector("button[aria-keyshortcuts]")
  if (button) button.click()
}
setTimeout(autorun, 50)
"LIA: stop"
</script>
@end

@THREE.eval: @THREE.eval_(@uid)

@THREE.eval_
<script>
if (window.LiaThree) {
  try {
    LiaThree.exec("three-@0", `@'input`, "js", send)
  } catch (e) {
    if (e.liaLine && typeof LiaError !== "undefined") {
      let err = new LiaError(e.message, 1)
      err.add_detail(0, e.message, "error", e.liaLine - 1, e.liaColumn || 0)
      throw err
    }
    console.error(e.message)
    "LIA: stop"
  }
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    try {
      if (LiaThree.exec("three-@0", `@'input`, "js", send) !== "LIA: wait") send.lia("LIA: stop")
    } catch (e) {
      console.error(e.message)
      send.lia("LIA: stop")
    }
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>

@THREE.autorun(@0)
@end


@THREE.building: @THREE.building_(@uid)

@THREE.building_
<script>
if (window.LiaThree) {
  try {
    LiaThree.exec("three-@0", `@'input`, "building", send)
  } catch (e) {
    if (e.liaLine && typeof LiaError !== "undefined") {
      let err = new LiaError(e.message, 1)
      err.add_detail(0, e.message, "error", e.liaLine - 1, 0)
      throw err
    }
    console.error(e.message)
    "LIA: stop"
  }
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    try {
      if (LiaThree.exec("three-@0", `@'input`, "building", send) !== "LIA: wait") send.lia("LIA: stop")
    } catch (e) {
      console.error(e.message)
      send.lia("LIA: stop")
    }
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>

@THREE.autorun(@0)
@end


@THREE.scene: @THREE.scene_(@uid,```@0```)

@THREE.scene_
<script modify="false">
function run() {
  try {
    return LiaThree.exec("three-@0", `@'1`, "js", send, true)
  } catch (e) {
    console.error(e.message)
    return "LIA: stop"
  }
}
if (window.LiaThree) {
  run()
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    if (run() !== "LIA: wait") send.lia("LIA: stop")
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>
@end


@THREE.scene.building: @THREE.scene.building_(@uid,```@0```)

@THREE.scene.building_
<script modify="false">
function run() {
  try {
    return LiaThree.exec("three-@0", `@'1`, "building", send, true)
  } catch (e) {
    console.error(e.message)
    return "LIA: stop"
  }
}
if (window.LiaThree) {
  run()
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    if (run() !== "LIA: wait") send.lia("LIA: stop")
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>
@end


@THREE.gltf: @THREE.gltf_(@uid,@0)

@THREE.gltf_
<script modify="false">
function run() {
  try {
    return LiaThree.exec("three-@0", "@1", "gltf", send, true)
  } catch (e) {
    console.error(e.message)
    return "LIA: stop"
  }
}
if (window.LiaThree) {
  run()
} else {
  // the bundle is still loading
  let timer = setInterval(() => {
    if (!window.LiaThree) return
    clearInterval(timer)
    if (run() !== "LIA: wait") send.lia("LIA: stop")
  }, 50)
  "LIA: wait"
}
</script>

<div id="three-@0"></div>
@end
```
