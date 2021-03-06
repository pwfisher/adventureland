import { ItemKey } from '../../types/adventureland/enum/ItemKey'
import { itemsToExchange } from './itemsToExchange'

export const itemsToBuy: Set<ItemKey> = new Set([
  // Exchangables
  ...itemsToExchange,
  // Belts
  'dexbelt',
  'intbelt',
  'strbelt',
  // Rings
  'ctristone',
  'dexring',
  'intring',
  'ringofluck',
  'strring',
  'suckerpunch',
  'tristone',
  // Earrings
  'dexearring',
  'intearring',
  'lostearring',
  'strearring',
  // Amulets
  'amuletofm',
  // 'dexamulet',
  // 'intamulet',
  'snring',
  // 'stramulet',
  // 't2dexamulet',
  // 't2intamulet',
  // 't2stramulet',
  // Orbs
  'charmer',
  'ftrinket',
  'jacko',
  'orbg',
  'orbofdex',
  'orbofint',
  'orbofsc',
  'orbofstr',
  'rabbitsfoot',
  'talkingskull',
  // Shields
  't2quiver',
  'lantern',
  'mshield',
  'quiver',
  'sshield',
  'xshield',
  // Capes
  'angelwings',
  'bcape',
  'cape',
  'ecape',
  'stealthcape',
  // Shoes
  'eslippers',
  'hboots',
  'mrnboots',
  'mwboots',
  'shoes1',
  'wingedboots',
  'wshoes',
  'xboots',
  // Pants
  'hpants',
  'mrnpants',
  'mwpants',
  'pants1',
  'starkillers',
  'wbreeches',
  'xpants',
  // Armor
  'cdragon',
  'coat1',
  'harmor',
  'mcape',
  'mrnarmor',
  'mwarmor',
  'tshirt0',
  'tshirt1',
  'tshirt2',
  'tshirt3',
  'tshirt4',
  'tshirt6',
  'tshirt7',
  'tshirt8',
  'tshirt88',
  'tshirt9',
  'warpvest',
  'wattire',
  'xarmor',
  // Helmets
  'eears',
  'fury',
  'helmet1',
  'hhelmet',
  'mrnhat',
  'mwhelmet',
  'partyhat',
  'rednose',
  'wcap',
  'xhelmet',
  // Gloves
  'gloves1',
  'goldenpowerglove',
  'handofmidas',
  'hgloves',
  'mrngloves',
  'mwgloves',
  'poker',
  'powerglove',
  'wgloves',
  'xgloves',
  // Good weapons
  'basher',
  'bataxe',
  'bowofthedead',
  'candycanesword',
  'carrotsword',
  'crossbow',
  'dartgun',
  'firebow',
  'frostbow',
  'froststaff',
  'gbow',
  'harbringer',
  'hbow',
  'merry',
  'oozingterror',
  'ornamentstaff',
  'pmace',
  't2bow',
  't3bow',
  'wblade',
  // Things we can exchange / craft with
  'ascale',
  'bfur',
  'cscale',
  'electronics',
  'feather0',
  'fireblade',
  'goldenegg',
  'goldingot',
  'goldnugget',
  'leather',
  'networkcard',
  'platinumingot',
  'platinumnugget',
  'pleather',
  'snakefang',
  // Things to make xbox
  'x0',
  'x1',
  'x2',
  'x3',
  'x4',
  'x5',
  'x6',
  'x7',
  'x8',
  // Things to make easter basket
  'egg0',
  'egg1',
  'egg2',
  'egg3',
  'egg4',
  'egg5',
  'egg6',
  'egg7',
  'egg8',
  // Essences
  'essenceofether',
  'essenceoffire',
  'essenceoffrost',
  'essenceoflife',
  'essenceofnature',
  // Potions & consumables
  'bunnyelixir',
  'candypop',
  'elixirdex0',
  'elixirdex1',
  'elixirdex2',
  'elixirint0',
  'elixirint1',
  'elixirint2',
  'elixirluck',
  'elixirstr0',
  'elixirstr1',
  'elixirstr2',
  'greenbomb',
  'hotchocolate',
  // High level scrolls
  'cscroll3',
  'scroll3',
  'scroll4',
  'forscroll',
  'luckscroll',
  'manastealscroll',
  // Misc. Things
  'bottleofxp',
  'bugbountybox',
  'computer',
  'monstertoken',
  'poison',
  // 'snakeoil',
])
