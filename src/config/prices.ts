const [scroll0, scroll1, scroll2] = [1000, 40000, 1600000]

// Market Prices
const offeringp = 2.5 * 1000 * 1000
const wbook0 = 50 * 1000
const essenceoffire = 650 * 1000

// Book of Knowledge
const wbook1 = 3 * wbook0 / 0.99 + scroll0
const wbook2 = 3 * wbook1 / 0.68 + scroll0 // 674k
const wbook2Upsized = 3 * wbook1 / 0.82 + scroll1 // 598k -- UPSIZED scroll CHEAPER

// Fire Staff
const staff = 12400 // vendor retail price
const firestaff0 = essenceoffire + staff // craft
const firestaff1 = firestaff0 / 0.9999 + scroll1 // 452k
const firestaff2 = firestaff1 / 0.97 + scroll1 // 506k -- always 97%
const firestaff2Upsized = firestaff1 / 0.9999 + scroll2 // 2.0m
const firestaff3 = firestaff2 / 0.94 + scroll1 // 579k
const firestaff3Upsized = firestaff2 / 0.9999 + scroll2 // 2.1m
const firestaff4 = firestaff3 / 0.68 + scroll1 // 891k
const firestaff4Upsized = firestaff3 / 0.826 + scroll2 // 2.30m
const firestaff4Primling = firestaff3 / 0.9999 + scroll1 + offeringp // 3.12m
const firestaff5 = firestaff4 / 0.58 + scroll1 // 1.58m
const firestaff5Upsized = firestaff4 / 0.706 + scroll2 // 2.86m
const firestaff5Primling = firestaff4 / 0.8119 + scroll1 + offeringp // 3.64m
const firestaff5UP = firestaff4 / 0.94 + scroll2 + offeringp // 5.05m
const firestaff6 = firestaff5 / 0.38 + scroll1 // 4.19m
const firestaff6Upsized = firestaff5 / 0.466 + scroll2 // 4.98m
const firestaff6Primling = firestaff5 / 0.5471 + scroll1 + offeringp // 5.42m
const firestaff6UP = firestaff5 / 0.6675 + scroll2 + offeringp // 6.46m
const firestaff7 = firestaff6 / 0.24 + scroll1 // 17.49m
const firestaff7Upsized = firestaff6 / 0.298 + scroll2 // 15.66m
const firestaff7Primling = firestaff6 / 0.3359 + scroll1 + offeringp // 15.01m
const firestaff7UP = firestaff6 / 0.4172 + scroll2 + offeringp // 14.14m -- winner: UPSIZE + PRIMLING
const firestaff8 = firestaff7UP / 0.178 + scroll2 // 81.03m
const firestaff8Primling = firestaff7UP / 0.262 + scroll2 + offeringp // 58.07m -- winner: PRIMLING
const firestaff9 = firestaff8Primling / 0.0706 + scroll2 // 824.1m
const firestaff9Primling = firestaff8Primling / 0.0922 + scroll2 + offeringp // 633.9m -- winner: PRIMLING

console.log({
  firestaff0: Math.round(firestaff0).toLocaleString(),
  firestaff1: Math.round(firestaff1).toLocaleString(),
  firestaff2: Math.round(firestaff2).toLocaleString(),
  firestaff2Upsized: Math.round(firestaff2Upsized).toLocaleString(),
  firestaff3: Math.round(firestaff3).toLocaleString(),
  firestaff3Upsized: Math.round(firestaff3Upsized).toLocaleString(),
  firestaff4: Math.round(firestaff4).toLocaleString(),
  firestaff4Upsized: Math.round(firestaff4Upsized).toLocaleString(),
  firestaff4Primling: Math.round(firestaff4Primling).toLocaleString(),
  firestaff5: Math.round(firestaff5).toLocaleString(),
  firestaff5Upsized: Math.round(firestaff5Upsized).toLocaleString(),
  firestaff5Primling: Math.round(firestaff5Primling).toLocaleString(),
  firestaff5UP: Math.round(firestaff5UP).toLocaleString(),
  firestaff6: Math.round(firestaff6).toLocaleString(),
  firestaff6Upsized: Math.round(firestaff6Upsized).toLocaleString(),
  firestaff6Primling: Math.round(firestaff6Primling).toLocaleString(),
  firestaff6UP: Math.round(firestaff6UP).toLocaleString(),
  firestaff7: Math.round(firestaff7).toLocaleString(),
  firestaff7Upsized: Math.round(firestaff7Upsized).toLocaleString(),
  firestaff7Primling: Math.round(firestaff7Primling).toLocaleString(),
  firestaff7UP: Math.round(firestaff7UP).toLocaleString(),
  firestaff8: Math.round(firestaff8).toLocaleString(),
  firestaff8Primling: Math.round(firestaff8Primling).toLocaleString(),
  firestaff9: Math.round(firestaff9).toLocaleString(),
  firestaff9Primling: Math.round(firestaff9Primling).toLocaleString(),
  wbook0: Math.round(wbook0).toLocaleString(),
  wbook1: Math.round(wbook1).toLocaleString(),
  wbook2: Math.round(wbook2).toLocaleString(),
  wbook2Upsized: Math.round(wbook2Upsized).toLocaleString(),
})

// export {
//   firestaff1,
//   wbook2,
//   wbook2Upsized,
// }
