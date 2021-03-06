const caveLoop = [
  { x: 295, y: -245 }, // southwest
  { x: 355, y: -220 },
  { x: 415, y: -185 },
  { x: 480, y: -185 },
  { x: 560, y: -190 }, // southeast
  { x: 600, y: -225 },
  { x: 650, y: -310 },
  { x: 650, y: -395 },
  { x: 615, y: -470 },
  { x: 560, y: -515 },
  { x: 480, y: -525 },
  { x: 405, y: -530 }, // north
  { x: 340, y: -510 },
  { x: 290, y: -475 },
  { x: 260, y: -415 },
  { x: 255, y: -350 },
  { x: 265, y: -295 },
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
      ...caveLoop,
      caveLoop[0],
    ],
    [
      // from north
      { x: 400, y: -800 },
      { x: 400, y: -750 },
      { x: 400, y: -700 },
      { x: 400, y: -650 },
      { x: 400, y: -600 },
      caveLoop[11],
      caveLoop[12],
      caveLoop[13],
      caveLoop[14],
      caveLoop[15],
      caveLoop[16],
      ...caveLoop,
    ],
    [
      // from south
      { x: 1000, y: 75 },
      { x: 950, y: 75 },
      { x: 900, y: 75 },
      { x: 850, y: 75 },
      { x: 800, y: 70 },
      { x: 750, y: 65 },
      { x: 700, y: 60 },
      { x: 650, y: 55 },
      { x: 600, y: 50 },
      { x: 590, y: -15 },
      { x: 575, y: -115 },
      { x: 600, y: 50 },
      caveLoop[4],
      caveLoop[5],
      caveLoop[6],
      caveLoop[7],
      caveLoop[8],
      caveLoop[9],
      caveLoop[10],
      caveLoop[11],
      caveLoop[12],
      caveLoop[13],
      caveLoop[14],
      caveLoop[15],
      caveLoop[16],
      ...caveLoop,
    ],
  ],
  desertland: [
    [
      // Sprawling / plantoid
      { x: -625, y: -500 },
      { x: -700, y: -575 },
      { x: -825, y: -575 },
      { x: -925, y: -550 },
      { x: -975, y: -425 },
      { x: -975, y: -300 },
      { x: -950, y: -175 },
      { x: -825, y: -125 },
      { x: -675, y: -200 },
      { x: -600, y: -325 },
      { x: -600, y: -475 },
      { x: -625, y: -500 },
    ],
    [
      // black scorpion (primling)
      // smart_move('bscorpion')
      { x: -525, y: -1313, },
      { x: -540, y: -1285, },
      { x: -525, y: -1234, },
      { x: -504, y: -1204, },
      { x: -469, y: -1179, },
      { x: -426, y: -1171, },
      { x: -372, y: -1182, },
      { x: -324, y: -1210, },
      { x: -300, y: -1260, },
      { x: -322, y: -1319, },
      { x: -363, y: -1350, },
      { x: -411, y: -1372, },
      { x: -455, y: -1375, },
      { x: -496, y: -1356, },
      { x: -529, y: -1333, },
      { x: -525, y: -1313, },
    ]
  ],
  tunnel: [[...tunnelLoop, tunnelLoop[0]]],
}
