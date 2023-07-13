

/* Note by Platonic, April 1 2021
This is an experimental file for making cubes their own class
and make them easily re-used for later purposes.
Please do not change the *file name* or use anything developed in this
file without asking me first. You may edit this file as much as you
want, though!
Thank you! */

/* Note by Platonic, July 1 2023
Disregard my old self above.
This is a non-experimental file for making cubes their own class
and make them easily re-used for later purposes (yeah, duh, that's what classes are for).
Edit the file however you want, I really don't care. */

import Decimal from 'break_infinity.js'
import i18next from 'i18next'
import { achievementaward } from './Achievements'
import { calculateCubeBlessings } from './Calculate'
import { CalcECC } from './Challenges'
import { calculateHypercubeBlessings } from './Hypercubes'
import { calculatePlatonicBlessings } from './PlatonicCubes'
import { quarkHandler } from './Quark'
import { format, player } from './Synergism'
import { calculateTesseractBlessings } from './Tesseracts'
import type { Player } from './types/Synergism'
import { Prompt, Alert } from './UpdateHTML'
import { autoCraftHepteracts } from './Hepteracts'
import { autoBuyCubeUpgrades, autoTesseractBuildings } from './Cubes'
import { autoBuyPlatonicUpgrades } from './Platonic'
import { getNumberOfDigits } from './Utility'

/* Constants */

const blessings: Record<
    keyof Player['cubeBlessings'],
    { weight: number, pdf: (x: number) => boolean }
> = {
  accelerator: { weight: 4, pdf: (x: number) => 0 <= x && x <= 20 },
  multiplier: { weight: 4, pdf: (x: number) => 20 < x && x <= 40 },
  offering: { weight: 2, pdf: (x: number) => 40 < x && x <= 50 },
  runeExp: { weight: 2, pdf: (x: number) => 50 < x && x <= 60 },
  obtainium: { weight: 2, pdf: (x: number) => 60 < x && x <= 70 },
  antSpeed: { weight: 2, pdf: (x: number) => 70 < x && x <= 80 },
  antSacrifice: { weight: 1, pdf: (x: number) => 80 < x && x <= 85 },
  antELO: { weight: 1, pdf: (x: number) => 85 < x && x <= 90 },
  talismanBonus: { weight: 1, pdf: (x: number) => 90 < x && x <= 95 },
  globalSpeed: { weight: 1, pdf: (x: number) => 95 < x && x <= 100 }
}

const platonicBlessings: Record <
    keyof Player['platonicBlessings'],
    { weight: number, pdf: (x: number) => boolean }
> = {
  cubes: { weight: 13200, pdf: (x: number) => 0 <= x && x <= 33.000 },
  tesseracts: { weight: 13200, pdf: (x: number) => 33.000 < x && x <= 66.000 },
  hypercubes: { weight: 13200, pdf: (x: number) => 66.000 < x && x <= 99.000 },
  platonics: { weight: 396, pdf: (x: number) => 99.000 < x && x <= 99.990 },
  hypercubeBonus: { weight: 1, pdf: (x: number) => 99.990 < x && x <= 99.9925 },
  taxes: { weight: 1, pdf: (x: number) => 99.9925 < x && x <= 99.995 },
  scoreBonus: { weight: 1, pdf: (x: number) => 99.995 < x && x <= 99.9975 },
  globalSpeed: { weight: 1, pdf: (x: number) => 99.9975 < x && x <= 100 }
}

const autoCubeReq = () => {
  return (player.highestSingularityCount >= 35 && player.autoOpenCubes && player.openCubes !== 0 && player.cubeUpgrades[51] > 0)
}

const autoTessReq = () => {
  return (player.highestSingularityCount >= 35 && player.autoOpenTesseracts && player.openTesseracts !== 0 && player.challengecompletions[11] > 0 && (player.tesseractAutoBuyerToggle !== 1 || player.resettoggle4 === 2))
}

const autoHypReq = () => {
  return (player.highestSingularityCount >= 35 && player.autoOpenHypercubes && player.openHypercubes !== 0 && player.challengecompletions[13] > 0)
}

const autoPlatReq = () => {
  return (player.highestSingularityCount >= 35 && player.autoOpenPlatonicsCubes && player.openTesseracts !== 0 && player.challengecompletions[14] > 0)
}

export abstract class Cube {
  public value: number

  constructor (
    v = 0
  ) {
    this.value = v
  }

  abstract add(amount: number): this

  sub(amount: number): this {
    this.value = Math.max(0, this.value - amount)
    return this
  }

  [Symbol.toPrimitive](h: string) {
    switch (h) {
      case 'string': return this.value.toString()
      case 'number': return this.value
      default: return null
    }
  }

  get digits() {
    return getNumberOfDigits(this.value)
  }
}

export abstract class NonOpenableCube extends Cube {
  public autoFunc?: () => void

  constructor (
    v = 0,
    autofunc?: () => void
  ) {
    super(v)
    this.autoFunc = autofunc // can be undefined!
  }

  add(amount: number): this {
    this.value = Math.min(1e300, this.value + amount)
    if (this.autoFunc !== undefined) {
      this.autoFunc()
    }
    return this
  }
}
/**
 * @description Generic class for handling cubes which may be 'opened'.
 * @example
 * class PlatCubes extends Currency {
 *   constructor() {
 *       super('wowPlatonicCubes', player.wowPlatonicCubes);
 *   }
 *
 *   async open(amount: number, value: boolean) {
 *       // implement open logic here
 *   }
 * }
 *
 * new PlatCubes().openCustom();
 */
export abstract class OpenableCube extends Cube {
  /** key on the player object */
  private key: keyof Player
  public autoCubeKey: keyof Player
  public autoReq: () => boolean
  public autoFunc?: () => void

  constructor (
    type: keyof Player,
    autoType: keyof Player,
    autoReq: () => boolean,
    v = 0,
    autoFunc?: () => void
  ) {
    super(v)
    this.key = type
    this.autoCubeKey = autoType
    this.autoReq = autoReq
    this.autoFunc = autoFunc // can be undefined!
  }

  add(amount: number, max = false): this {
    if (max) {
      void this.open(amount, false)
      /* void is fine here since the promise will not be rejected
        and return type is not used anywhere (return type is itself void) */
    } else {
      const percentage = player[this.autoCubeKey] as number
      const amountToOpen = this.autoReq() ? Math.floor(amount * percentage / 100) : 0
      this.value = Math.min(1e300, this.value + amount)
      void this.open(amountToOpen, false) // ditto

      if (this.autoFunc !== undefined) {
        this.autoFunc()
      }
    }
    return this
  }

    /**
     * @description Open a given amount of cubes
     * @param amount Number of cubes to open
     * @param max if true, overwrites amount and opens the max amount of cubes.
     */
    abstract open(amount: number, max: boolean): Promise<void> | void

    /** Open a custom amount of cubes */
    async openCustom() {
      // TODO: Replace this with `this`?
      const thisInPlayer = player[this.key] as OpenableCube
      const amount = await Prompt(i18next.t('cubes.howManyCubesOpen', { x: format(thisInPlayer, 0, true) }))

      if (amount === null) {
        return Alert(i18next.t('cubes.noCubesOpened'))
      }

      const isPercentage = amount.endsWith('%')
      const cubesToOpen = amount.startsWith('-')
        ? (isPercentage ? 100 + Number(amount.slice(0, -1)) : thisInPlayer.value + Number(amount))
        : (isPercentage ? Number(amount.slice(0, -1)) : Number(amount))

      if (Number.isNaN(cubesToOpen) || !Number.isFinite(cubesToOpen) || !Number.isInteger(cubesToOpen)) {
        return Alert(i18next.t('general.validation.finiteInt'))
      } else if (thisInPlayer.value < cubesToOpen) {
        return Alert(i18next.t('cubes.validation.notEnough'))
      } else if (cubesToOpen <= 0) {
        return Alert(i18next.t('cubes.validation.negative'))
      } else if (isPercentage && cubesToOpen > 100) {
        return Alert(i18next.t('cubes.validation.invalidPercent', { x: cubesToOpen }))
      }

      if (isPercentage) {
        return this.open(
          Math.floor(thisInPlayer.value * (cubesToOpen / 100)),
          cubesToOpen === 100
        )
      }

      return this.open(cubesToOpen, cubesToOpen === thisInPlayer.value)
    }

    /** @description Check how many quarks you should have gained through opening cubes today */
    checkQuarkGain(base: number, mult: number, cubes: number): number {
      if (cubes < 1) {
        return 0
      }
      // General quark multiplier from other in-game features
      // Multiplier from passed parameter
      const multiplier = mult * quarkHandler().cubeMult

      return Math.floor(player.worlds.applyBonus(Math.log10(cubes) * base * multiplier))
    }

    /** @description Check how many cubes you need to gain an additional quark from opening */
    checkCubesToNextQuark(base: number, mult: number, quarks: number, cubes: number): number {
      // General quark multiplier from other in-game features
      // Multiplier from passed parameter
      const multiplier = mult * quarkHandler().cubeMult

      return Math.ceil(Math.pow(10, (quarks + 1) / player.worlds.applyBonus(multiplier * base)) - cubes)
    }

    sub(amount: number): this {
      this.value = Math.max(0, this.value - amount)
      return this
    }
}

export class WowCubes extends OpenableCube {
  constructor(amount = Number(player.wowCubes)) {
    super('wowCubes', 'openCubes', autoCubeReq, amount, autoBuyCubeUpgrades)
  }

  open(value: number, max = false) {
    let toSpend = max ? Number(this) : Math.min(Number(this), value)
    if (value === 1 && player.cubeBlessings.accelerator >= 2e11 && player.achievements[246] < 1) {
      achievementaward(246)
    }

    this.sub(toSpend)
    player.cubeOpenedDaily += toSpend

    const quarkMult = (player.shopUpgrades.cubeToQuark) ? 1.5 : 1
    const gainQuarks = Number(this.checkQuarkGain(5, quarkMult, player.cubeOpenedDaily))
    const actualQuarksGain = Math.max(0, gainQuarks - player.cubeQuarkDaily)
    player.cubeQuarkDaily += actualQuarksGain
    player.worlds.add(actualQuarksGain, false)

    toSpend *= (1 + player.researches[138] / 1000)
    toSpend *= (1 + 0.8 * player.researches[168] / 1000)
    toSpend *= (1 + 0.6 * player.researches[198] / 1000)

    toSpend = Math.floor(toSpend)
    let toSpendModulo = toSpend % 20
    let toSpendDiv20 = Math.floor(toSpend / 20)

    if (toSpendDiv20 > 0 && player.cubeUpgrades[13] === 1) {
      toSpendModulo += toSpendDiv20
    }
    if (toSpendDiv20 > 0 && player.cubeUpgrades[23] === 1) {
      toSpendModulo += toSpendDiv20
    }
    if (toSpendDiv20 > 0 && player.cubeUpgrades[33] === 1) {
      toSpendModulo += toSpendDiv20
    }

    toSpendDiv20 += 100 / 100 * Math.floor(toSpendModulo / 20)
    toSpendModulo = toSpendModulo % 20

    const keys = Object.keys(player.cubeBlessings) as (keyof Player['cubeBlessings'])[]

    // If you're opening more than 20 cubes, it will consume all cubes until remainder mod 20, giving expected values.
    for (const key of keys) {
      player.cubeBlessings[key] += blessings[key].weight * toSpendDiv20 * (1 + Math.floor(CalcECC('ascension', player.challengecompletions[12])))
    }

    // Then, the remaining cubes will be opened, simulating the probability [RNG Element]
    for (let i = 0; i < toSpendModulo; i++) {
      const num = 100 * Math.random()
      for (const key of keys) {
        if (blessings[key].pdf(num)) {
          player.cubeBlessings[key] += (1 + Math.floor(CalcECC('ascension', player.challengecompletions[12])))
        }
      }
    }

    calculateCubeBlessings()
  }
}

export class WowTesseracts extends OpenableCube {
  constructor(amount = Number(player.wowTesseracts)) {
    super('wowTesseracts', 'openTesseracts', autoTessReq, amount, autoTesseractBuildings)
  }

  open(value: number, max = false) {
    const toSpend = max ? Number(this) : Math.min(Number(this), value)

    player.wowTesseracts.sub(toSpend)
    player.tesseractOpenedDaily += toSpend

    const quarkMult = (player.shopUpgrades.tesseractToQuark) ? 1.5 : 1
    const gainQuarks = Number(this.checkQuarkGain(7, quarkMult, player.tesseractOpenedDaily))
    const actualQuarksGain = Math.max(0, gainQuarks - player.tesseractQuarkDaily)
    player.tesseractQuarkDaily += actualQuarksGain
    player.worlds.add(actualQuarksGain, false)

    const toSpendModulo = toSpend % 20
    const toSpendDiv20 = Math.floor(toSpend / 20)

    // If you're opening more than 20 Tesseracts, it will consume all Tesseracts until remainder mod 20, giving expected values.
    for (const key in player.tesseractBlessings) {
      player.tesseractBlessings[key as keyof Player['tesseractBlessings']] += blessings[key as keyof typeof blessings].weight * toSpendDiv20
    }
    // Then, the remaining tesseract will be opened, simulating the probability [RNG Element]
    for (let i = 0; i < toSpendModulo; i++) {
      const num = 100 * Math.random()
      for (const key in player.tesseractBlessings) {
        if (blessings[key as keyof typeof blessings].pdf(num)) {
          player.tesseractBlessings[key as keyof Player['tesseractBlessings']] += 1
        }
      }
    }

    calculateTesseractBlessings()
    const extraCubeBlessings = Math.floor(12 * toSpend * player.researches[153])
    player.wowCubes.add(extraCubeBlessings, false)
  }
}

export class WowHypercubes extends OpenableCube {
  constructor(amount = Number(player.wowHypercubes)) {
    super('wowHypercubes', 'openHypercubes', autoHypReq, amount)
  }

  open(value: number, max = false) {
    const toSpend = max ? Number(this) : Math.min(Number(this), value)

    player.wowHypercubes.sub(toSpend)
    player.hypercubeOpenedDaily += toSpend

    const quarkMult = (player.shopUpgrades.hypercubeToQuark) ? 1.5 : 1
    const gainQuarks = this.checkQuarkGain(10, quarkMult, player.hypercubeOpenedDaily)
    const actualQuarksGain = Math.max(0, gainQuarks - player.hypercubeQuarkDaily)
    player.hypercubeQuarkDaily += actualQuarksGain
    player.worlds.add(actualQuarksGain, false)

    const toSpendModulo = toSpend % 20
    const toSpendDiv20 = Math.floor(toSpend/20)

    // If you're opening more than 20 Hypercubes, it will consume all Hypercubes until remainder mod 20, giving expected values.
    for (const key in player.hypercubeBlessings) {
      player.hypercubeBlessings[key as keyof Player['hypercubeBlessings']] += blessings[key as keyof typeof blessings].weight * toSpendDiv20
    }
    // Then, the remaining hypercubes will be opened, simulating the probability [RNG Element]
    for (let i = 0; i < toSpendModulo; i++) {
      const num = 100 * Math.random()
      for (const key in player.hypercubeBlessings) {
        if (blessings[key as keyof typeof blessings].pdf(num)) {
          player.hypercubeBlessings[key as keyof Player['hypercubeBlessings']] += 1
        }
      }
    }

    calculateHypercubeBlessings()
    const extraTesseractBlessings = Math.floor(100 * toSpend * player.researches[153])
    player.wowTesseracts.add(extraTesseractBlessings, false)
  }
}

export class WowPlatonicCubes extends OpenableCube {
  constructor(amount = Number(player.wowPlatonicCubes)) {
    super('wowPlatonicCubes', 'openPlatonicsCubes', autoPlatReq, amount, autoBuyPlatonicUpgrades)
  }

  open(value: number, max = false) {
    const toSpend = max ? Number(this) : Math.min(Number(this), value)

    player.wowPlatonicCubes.sub(toSpend)
    player.platonicCubeOpenedDaily += toSpend

    const quarkMult = 1.5 // There's no platonic to quark upgrade, default as 1.5
    const gainQuarks = this.checkQuarkGain(15, quarkMult, player.platonicCubeOpenedDaily)
    const actualQuarksGain = Math.max(0, gainQuarks - player.platonicCubeQuarkDaily)
    player.platonicCubeQuarkDaily += actualQuarksGain
    player.worlds.add(actualQuarksGain, false)

    let toSpendModulo = toSpend % 40000
    const toSpendDiv40000 = Math.floor(toSpend / 40000)

    //If you're opening more than 40,000 Platonics, it will consume all Platonics until remainder mod 40,000, giving expected values.
    for (const key in player.platonicBlessings) {
      player.platonicBlessings[key as keyof Player['platonicBlessings']] += platonicBlessings[key as keyof typeof platonicBlessings].weight * toSpendDiv40000
      if (platonicBlessings[key as keyof typeof platonicBlessings].weight === 1 && player.cubeUpgrades[64] > 0) {
        player.platonicBlessings[key as keyof Player['platonicBlessings']] += toSpendDiv40000 // Doubled!
      }
    }
    //Then, the remaining hypercube will be opened, simulating the probability [RNG Element]
    const RNGesus = ['hypercubeBonus', 'taxes', 'scoreBonus', 'globalSpeed']
    for (let i = 0; i < RNGesus.length; i++) {
      const num = Math.random()
      if (toSpendModulo / 40000 >= num && toSpendModulo !== 0) {
        player.platonicBlessings[RNGesus[i] as keyof Player['platonicBlessings']] += 1
        toSpendModulo -= 1
      }
    }
    const gainValues = [Math.floor(33 * toSpendModulo / 100), Math.floor(33 * toSpendModulo / 100), Math.floor(33 * toSpendModulo / 100), Math.floor(396 * toSpendModulo / 40000)]
    const commonDrops = ['cubes', 'tesseracts', 'hypercubes', 'platonics'] as const
    for (let i = 0; i < commonDrops.length; i++) {
      player.platonicBlessings[commonDrops[i]] += gainValues[i]
      toSpendModulo -= gainValues[i]
    }

    for (let i = 0; i < toSpendModulo; i++) {
      const num = 100 * Math.random()
      for (const key in player.platonicBlessings) {
        if (platonicBlessings[key as keyof typeof platonicBlessings].pdf(num)) {
          player.platonicBlessings[key as keyof Player['platonicBlessings']] += 1
        }
      }
    }
    calculatePlatonicBlessings()
    if (player.achievements[271] > 0) {
      const extraHypercubes = Math.floor(toSpend * Math.max(0, Math.min(1, (Decimal.log(player.ascendShards.add(1), 10) - 1e5) / 9e5)))
      player.wowHypercubes.add(extraHypercubes, false)
    }
  }
}

export class WowHepteracts extends NonOpenableCube {
  constructor(amount = Number(player.wowAbyssals)) {
    super(amount, autoCraftHepteracts)
  }
}

export class WowOcteracts extends NonOpenableCube {
  constructor(amount = Number(player.wowOcteracts)) {
    super(amount)
  }
}

export const getTotalCubeDigits = () => {
  return (player.wowCubes.digits +
          player.wowTesseracts.digits +
          player.wowHypercubes.digits +
          player.wowPlatonicCubes.digits +
          player.wowAbyssals.digits +
          player.wowOcteracts.digits)
}