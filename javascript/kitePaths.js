const caveLoop = [
  { x: 375, y: -200 }, // lower left
  { x: 575, y: -200 },
  { x: 650, y: -350 },
  { x: 575, y: -475 },
  { x: 400, y: -500 },
  { x: 300, y: -350 },
]

const tunnelLoop = [
  // untested. too aggro?
  { x: 0, y: -75 }, // bottom
  { x: 125, y: -125 },
  { x: 200, y: -350 },
  { x: 150, y: -550 },
  { x: 0, y: -600 },
  { x: -150, y: -575 },
  { x: -175, y: -350 },
  { x: -125, y: -125 },
]

/**
 * NB: when a point is repeated in the sequence, nextPoint(x) !== 0
 */
const kitePaths = {
  arena: [
    [
      { x: 150, y: -50 },
      { x: 300, y: -50 },
      { x: 450, y: -50 },
      { x: 600, y: -50 },
      { x: 725, y: -125 },
      { x: 725, y: -275 },
      { x: 700, y: -425 },
      { x: 600, y: -500 },
      { x: 475, y: -550 },
      { x: 325, y: -550 },
      { x: 175, y: -525 },
      { x: 50, y: -500 },
      { x: -100, y: -425 },
      { x: -175, y: -300 },
      { x: -175, y: -175 },
      { x: -100, y: -100 },
      { x: 25, y: -50 },
      { x: 150, y: -50 },
    ],
  ],
  cave: [
    [
      // from west
      { x: -50, y: -350 },
      { x: 0, y: -200 },
      caveLoop[0],
      caveLoop[1],
      caveLoop[2],
      caveLoop[3],
      caveLoop[4],
      caveLoop[5],
      caveLoop[0],
    ],
    [
      // from north
      { x: 400, y: -800 },
      caveLoop[4],
      caveLoop[5],
      caveLoop[0],
      caveLoop[1],
      caveLoop[2],
      caveLoop[3],
      caveLoop[4],
    ],
    [
      // from south
      { x: 1000, y: 75 },
      { x: 600, y: 50 },
      caveLoop[1],
      caveLoop[2],
      caveLoop[3],
      caveLoop[4],
      caveLoop[5],
      caveLoop[0],
      caveLoop[1],
    ],
  ],
  tunnel: [[...tunnelLoop, tunnelLoop[0]]],
}
