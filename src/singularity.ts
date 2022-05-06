import { DOMCacheGetOrSet } from './Cache/DOM'
import { format, player } from './Synergism'
import type { Player } from './types/Synergism'
import { Notification, Alert, Prompt } from './UpdateHTML'
import { toOrdinal } from './Utility'
import { toggleAutoResearch } from './Toggles'
import { testing } from './Config';
import { singsing } from './Reset';
import { Globals as G } from './Variables'
import { cubeAutomationIndices, researchAutomationIndices, getCubeMax } from './Cubes';

/**
 *
 * Updates all statistics related to Singularities in the Singularity Tab.
 *
 */
export const updateSingularityStats = ():void => {
    const str = `You are in the ${toOrdinal(player.singularityCount)} singularity, and have ${format(player.goldenQuarks,0,true)} golden quarks.
                 Global Speed is divided by ${format(calculateSingularityDebuff('Global Speed'), 2, true)}.
                 Ascension Speed is divided by ${format(calculateSingularityDebuff('Ascension Speed'), 2, true)}
                 Offering Gain is divided by ${format(calculateSingularityDebuff('Offering'), 2, true)}
                 Obtainium Gain is divided by ${format(calculateSingularityDebuff('Obtainium'), 2, true)}
                 Cube Gain is divided by ${format(calculateSingularityDebuff('Cubes'), 2, true)}.
                 Research Costs are multiplied by ${format(calculateSingularityDebuff('Researches'), 2, true)}.
                 Cube Upgrade Costs (Excluding Cookies) are multiplied by ${format(calculateSingularityDebuff('Cube Upgrades'), 2, true)}.
                 Antiquities of Ant God is ${(player.runelevels[6] > 0) ? '' : 'NOT'} purchased. Penalties are ${(player.runelevels[6] > 0) ? '' : 'NOT'} dispelled!`

    DOMCacheGetOrSet('singularityMultiline').textContent = str;
}

export interface ISingularityData {
    name: string
    description: string
    level?: number
    maxLevel: number
    costPerLevel: number
    toggleBuy?: number
    goldenQuarksInvested?: number
    maxCapLevel?: number
    minimumSingularity?: number
}

/**
 * Singularity Upgrades are bought in the singularity tab, and all have their own
 * name, description, level and maxlevel, plus a feature to toggle buy on each.
 */
export class SingularityUpgrade {

    // Field Initialization
    private readonly name: string;
    private readonly description: string;
    public level = 0;
    private readonly maxLevel: number; //-1 = infinitely levelable
    public readonly costPerLevel: number;
    public toggleBuy = 1; //-1 = buy MAX (or 1000 in case of infinity levels!)
    public goldenQuarksInvested = 0;
    private readonly minimumSingularity: number;
    private readonly maxCapLevel: number;

    public constructor(data: ISingularityData) {
        //        console.log(data.name)
        this.name = data.name;
        this.description = data.description;
        this.level = data.level ?? this.level;
        this.maxLevel = data.maxLevel;
        this.costPerLevel = data.costPerLevel;
        this.toggleBuy = data.toggleBuy ?? 1;
        this.goldenQuarksInvested = data.goldenQuarksInvested ?? 0;
        this.maxCapLevel = data.maxCapLevel ?? 10000;
        this.minimumSingularity = data.minimumSingularity ?? 0;
    }

    /**
     * Given an upgrade, give a concise information regarding its data.
     * @returns A string that details the name, description, level statistic, and next level cost.
     */
    toString() {
        const costNextLevel = this.getCostTNL();
        const maxLevel = this.maxLevel === -1
            ? ''
            : `/${format(this.getMaxLevel(100), this.getMaxLevel() < 1 ? 2 : 0, true)}`;

        const minimumSingularity = this.minimumSingularity > 0
            ? `Minimum Singularity: ${this.minimumSingularity}`
            : 'No minimal singularity to purchase required'

        return `${this.name}
                ${this.description}
                ${minimumSingularity}
                Level ${format(this.level, 0, true)}${maxLevel}
                Cost for next level: ${format(costNextLevel, 0, true)} Golden Quarks.
                Spent Quarks: ${format(this.goldenQuarksInvested, 0, true)}`
    }

    public getUnlockCount() {
        return this.minimumSingularity;
    }

    private getMaxLevel(min = 1) {
        const level = this.maxLevel === 1 ? 1 : (Math.min(this.maxCapLevel, this.maxLevel * (1 + player.singularityCount * player.singularityUpgrades.singMaxLevelUp.level / 100)) + (this.maxLevel >= 1 ? Math.floor(player.singsing) : 0));
        return level > 1 ? Math.floor(level) : Math.floor(level * min) / min;
    }

    public updateUpgradeHTML() {
        DOMCacheGetOrSet('testingMultiline').textContent = this.toString()
    }

    /**
     * Retrieves the cost for upgrading the singularity upgrade once. Return 0 if maxed.
     * @returns A number representing how many Golden Quarks a player must have to upgrade once.
     */
    private getCostTNL() {
        return (this.maxLevel >= 0 && this.getMaxLevel() <= this.level) ? 0: this.costPerLevel * (1 + this.level);
    }

    /**
     * Buy levels up until togglebuy or maxxed.
     * @returns An alert indicating cannot afford, already maxxed or purchased with how many
     *          levels purchased
     */
    public async buyLevel() {
        this.toggleBuy = player.singupgradebuyamount;

        let purchased = 0;
        let maxPurchasable = (this.maxLevel === -1)
            ? ((this.toggleBuy === -1)
                ? 1000
                : this.toggleBuy)
            : Math.min(this.toggleBuy, this.getMaxLevel() - this.level);

        if (this.getMaxLevel(100) > 0 && this.getMaxLevel() < 1) {
            return Alert('This is something missing.')
        }

        if (maxPurchasable < 1) {
            return false
        }

        if (player.singularityCount < this.minimumSingularity) {
            return Alert('you\'re not powerful enough to purchase this yet.')
        }

        if (this.name === 'Singularity Of Singularity') {
            return singsing();
        }

        while (maxPurchasable > 0) {
            const cost = this.getCostTNL();
            if (player.goldenQuarks < cost) {
                break;
            } else {
                player.goldenQuarks -= cost;
                this.goldenQuarksInvested += cost;
                this.level += 1;
                purchased += 1;
                maxPurchasable -= 1;
            }
        }

        if (purchased === 0) {
            return Alert('You cannot afford this upgrade. Sorry!')
        }

        this.updateUpgradeHTML();
        updateSingularityStats();
    }

    public async saleLevel() {
        this.toggleBuy = player.singupgradebuyamount;

        if (!testing) {
            return false
        }

        let purchased = 0;
        let maxPurchasable = Math.max(1, Math.min(this.level, this.toggleBuy));

        if (player.singularityCount < this.minimumSingularity) {
            return Alert(`You cannot purchase because your Singularity Count is less than ${format(this.minimumSingularity, 0, true)}.`)
        }

        if (this.level < 1) {
            return Alert('Not enough levels.')
        }

        while (maxPurchasable > 0) {
            const cost = Math.max(0, this.costPerLevel * this.level);
            if (this.level <= 1 || Math.max(0, this.goldenQuarksInvested) < cost) {
                player.goldenQuarks += Math.max(0, this.goldenQuarksInvested);
                this.goldenQuarksInvested = 0;
                purchased -= this.level;
                this.level = 0;
                maxPurchasable = 0;
            } else {
                this.goldenQuarksInvested -= cost;
                player.goldenQuarks += cost;
                this.level -= 1;
                purchased -= 1;
                maxPurchasable -= 1;
            }
        }

        if (purchased === 0) {
            return Alert('You cannot afford this upgrade. Sorry!')
        }

        this.updateUpgradeHTML();
        updateSingularityStats();
        return false;
    }

    public async changeToggle() {

        // Is null unless given an explicit number
        const newToggle = await Prompt(`
        Set maximum purchase amount per click for the ${this.name} upgrade.

        type -1 to set to MAX by default.
        `);
        const newToggleAmount = Number(newToggle);

        if (newToggle === null) {
            return Alert(`Toggle kept at ${format(this.toggleBuy, 0, true)}.`)
        }

        if (!Number.isInteger(newToggle)) {
            return Alert('Toggle value must be a whole number!');
        }
        if (newToggleAmount < -1) {
            return Alert('The only valid negative number for toggle is -1.');
        }
        if (newToggleAmount === 0) {
            return Alert('You cannot set the toggle to 0.');
        }

        this.toggleBuy = newToggleAmount;
        const m = newToggleAmount === -1
            ? 'Your toggle is now set to MAX'
            : `Your toggle is now set to ${format(this.toggleBuy, 0, true)}`;

        return Alert(m);
    }

    public refund() {
        player.goldenQuarks += this.goldenQuarksInvested;
        this.level = 0;
        this.goldenQuarksInvested = 0;
    }
}

export const singularityData: Record<keyof Player['singularityUpgrades'], ISingularityData> = {
    goldenQuarks1: {
        name: 'Golden Quarks I',
        description: 'In the future, you will gain 5% more Golden Quarks on singularities! This also reduces the cost to buy Golden Quarks in the shop by 500 per level.',
        maxLevel: 10,
        costPerLevel: 12,
        maxCapLevel: 20
    },
    goldenQuarks2: {
        name: 'Golden Quarks II',
        description: 'If you buy this, you will gain 2% more Golden Quarks on singularities. This also reduces the cost to buy Golden Quarks in the shop by 200 per level. Stacks with the first upgrade.',
        maxLevel: 25,
        costPerLevel: 60,
        maxCapLevel: 50
    },
    goldenQuarks3: {
        name: 'Golden Quarks III',
        description: 'If you buy this, you will gain 1 Golden Quark per hour from Exports. Also reduces the cost to buy Golden Quarks in the shop by 1,000 per level.',
        maxLevel: 5,
        costPerLevel: 1000,
        maxCapLevel: 10
    },
    starterPack: {
        name: 'Starter Pack',
        description: 'Buy this! Buy This! Cube gain is permanently multiplied by 5, and gain 6x the Obtainium and Offerings from all sources, post-corruption.',
        maxLevel: 1,
        costPerLevel: 10
    },
    wowPass: {
        name: 'Wow Pass Unlock',
        description: 'This upgrade will convince the seal merchant to sell you more Wow Passes, which even persist on Singularity!. Shop is always accessible!',
        maxLevel: 1,
        costPerLevel: 500
    },
    cookies: {
        name: 'Cookie Recipes I',
        description: 'For just a few golden quarks, re-open Wow! Bakery, adding five cookie-related cube upgrades.',
        maxLevel: 1,
        costPerLevel: 100
    },
    cookies2: {
        name: 'Cookie Recipes II',
        description: 'Diversify Wow! Bakery into cooking slightly more exotic cookies, adding five more cookie-related cube upgrades..',
        maxLevel: 1,
        costPerLevel: 500
    },
    cookies3: {
        name: 'Cookie Recipes III',
        description: 'Your Bakers threaten to quit without a higher pay. If you do pay them, they will bake even more fancy cookies.',
        maxLevel: 1,
        costPerLevel: 24999
    },
    cookies4: {
        name: 'Cookie Recipes IV',
        description: 'This is a small price to pay for Salvation.',
        maxLevel: 1,
        costPerLevel: 199999
    },
    ascensions: {
        name: 'Improved Ascension Gain',
        description: 'Buying this, you will gain +2% Ascension Count forever, per level! Every 20 levels grants an additional, multiplicative +1% Ascension Count.',
        maxLevel: -1,
        costPerLevel: 5
    },
    corruptionFourteen: {
        name: 'Level Fourteen Corruptions',
        description: 'Buy this to unlock level fourteen corruptions :).',
        maxLevel: 1,
        costPerLevel: 1000
    },
    corruptionFifteen: {
        name: 'Level Fifteen Corruptions',
        description: 'This doesn\'t *really* raise the corruption limit. Rather, it adds one FREE level to corruption multipliers, no matter what (can exceed cap). :)',
        maxLevel: 1,
        costPerLevel: 40000
    },
    singOfferings1: {
        name: 'Offering Charge',
        description: 'Upgrade this to get +2% offerings per level, forever!',
        maxLevel: -1,
        costPerLevel: 1
    },
    singOfferings2: {
        name: 'Offering Storm',
        description: 'Apparently, you can use this bar to attract more offerings. +8% per level, to be precise.',
        maxLevel: 25,
        costPerLevel: 25,
        maxCapLevel: 100
    },
    singOfferings3: {
        name: 'Offering Tempest',
        description: 'This bar is so prestine, it\'ll make anyone submit their offerings. +4% per level, to be precise.',
        maxLevel: 40,
        costPerLevel: 500,
        maxCapLevel: 100
    },
    singObtainium1: {
        name: 'Obtainium Wave',
        description: 'Upgrade this to get +2% obtainium per level, forever!',
        maxLevel: -1,
        costPerLevel: 1
    },
    singObtainium2: {
        name: 'Obtainium Flood',
        description: 'Holy crap, water bending! +8% gained obtainium per level.',
        maxLevel: 25,
        costPerLevel: 25,
        maxCapLevel: 100
    },
    singObtainium3: {
        name: 'Obtainium Tsunami',
        description: 'A rising tide lifts all boats. +4% gained obtainium per level.',
        maxLevel: 40,
        costPerLevel: 500,
        maxCapLevel: 100
    },
    singCubes1: {
        name: 'Cube Flame',
        description: 'Upgrade this to get +2% Cubes per level, forever!',
        maxLevel: -1,
        costPerLevel: 1
    },
    singCubes2: {
        name: 'Cube Blaze',
        description: 'Burn some more Golden Quarks! +8% gained Cubes per level.',
        maxLevel: 25,
        costPerLevel: 25,
        maxCapLevel: 100
    },
    singCubes3: {
        name: 'Cube Inferno',
        description: 'Even Dante is impressed. +4% gained Cubes per level.',
        maxLevel: 40,
        costPerLevel: 500,
        maxCapLevel: 100
    },
    octeractUnlock: {
        name: 'Octeracts ;) (WIP)',
        description: 'Hey!!! What are you trying to do?!?',
        maxLevel: 1,
        costPerLevel: 8888,
        minimumSingularity: 10
    },
    offeringAutomatic: {
        name: 'Offering Lootzifer (WIP)',
        description: 'Black Magic. Don\'t make deals with the devil. Each second, you get +2% of offering gain automatically per level. Also +10% Offerings!',
        maxLevel: 50,
        costPerLevel: 2000,
        minimumSingularity: 6
    },
    singOfferingsA1: {
        name: 'Offering Spore',
        description: 'Upgrade this to get +1% offerings per singularity and per level, forever!',
        maxLevel: 20,
        costPerLevel: 5000,
        minimumSingularity: 3,
        maxCapLevel: 50
    },
    singObtainiumA1: {
        name: 'Obtainium Seed',
        description: 'Upgrade this to get +1% obtainiums per singularity and per level, forever!',
        maxLevel: 20,
        costPerLevel: 5000,
        minimumSingularity: 3,
        maxCapLevel: 50
    },
    singCubesA1: {
        name: 'Cube Colony',
        description: 'Upgrade this to get +1% cubes per singularity and per level, forever!',
        maxLevel: 20,
        costPerLevel: 5000,
        minimumSingularity: 3,
        maxCapLevel: 50
    },
    singTimeAccel: {
        name: 'Time Accel',
        description: 'Upgrade this to get +1% Global Speed Multiplier per singularity and per level, forever!',
        maxLevel: 20,
        costPerLevel: 200,
        minimumSingularity: 1,
        maxCapLevel: 50
    },
    singAscendTimeAccel: {
        name: 'Ascension Time Accel',
        description: 'Upgrade this to get +1% Ascension Speed Multiplier per singularity and per level, forever!',
        maxLevel: 20,
        costPerLevel: 10000,
        minimumSingularity: 3,
        maxCapLevel: 50
    },
    singQuark: {
        name: 'Singularity Quark',
        description: 'Upgrade this to get +1% Quarks per singularity and per level, supreme!',
        maxLevel: 5,
        costPerLevel: 100000,
        minimumSingularity: 5,
        maxCapLevel: 10
    },
    singGolden: {
        name: 'Singularity Golden Quark',
        description: 'Upgrade this to get +0.1% Golden Quarks per singularity and per level, supreme!',
        maxLevel: 1,
        costPerLevel: 10000000000,
        minimumSingularity: 20,
        maxCapLevel: 100
    },
    bakeCookies1: {
        name: 'Peak Offline',
        description: 'Want to bake cookies instead? You can go offline for 4 additional hours per level.',
        maxLevel: 30,
        costPerLevel: 100,
        minimumSingularity: 1,
        maxCapLevel: 60
    },
    bakeCookies2: {
        name: 'Singularity Peak Offline',
        description: 'Do you want to complain? Yes, it\'s an hour for each singularity and each level. It\'s the last.',
        maxLevel: 3,
        costPerLevel: 10000,
        minimumSingularity: 4,
        maxCapLevel: 30
    },
    singAutomation: {
        name: 'Singularity Automation [WIP]',
        description: 'This unlocks various automations when Singularity! The power of the effect is determined by the Singularity Automation Level * SingularityCount^2.\nThe power required for each automation feature is enhanced by the progress of the game. And automation is ultimately determined by randomness.\nIn addition, some settings will be inherited. This feature is still a test and will be fixed without notice. Good luck!',
        maxLevel: -1,
        costPerLevel: 1,
        minimumSingularity: 1
    },
    singSafeShop: {
        name: 'Safe Quark Shop',
        description: 'If you purchase this, Singularity will not reset the Quark Shop.',
        maxLevel: 1,
        costPerLevel: 30000,
        minimumSingularity: 1
    },
    singChallenge: {
        name: 'Rise Challenge',
        description: 'Each purchase will increase the transcend challenges cap by +300 and the reincarnation challenges cap by +4 and the ascension challenges cap by +2.\nThis works with the purchase of Antiquities of Ant God! Watch out for Cx20!',
        maxLevel: 4970,
        costPerLevel: 500,
        minimumSingularity: 4,
        maxCapLevel: 4970
    },
    singOverfluxPowder: {
        name: 'Powder Capacity',
        description: 'Increases the maximum number of Overflux Powders that can be stacked. If you are offline for 2 days or more, an additional +1 will be added. \nOverflux Powders are instantly converted by Overflux Orbs ^ Level * 0.05 without waiting for daily.',
        maxLevel: 10,
        costPerLevel: 2000,
        minimumSingularity: 2,
        maxCapLevel: 20
    },
    singCraftExpand: {
        name: 'Craft Expand',
        description: 'The capacity increased by Expand of Hepteract Craft is increased by 2^Level times.',
        maxLevel: 10,
        costPerLevel: 5000,
        minimumSingularity: 2,
        maxCapLevel: 20
    },
    singMagicalTalisman: {
        name: 'Magical Talisman',
        description: 'Talisman max level increase +5. Increases talisman max level for +1 each enhance.',
        maxLevel: 70,
        costPerLevel: 500,
        minimumSingularity: 6
    },
    singGQdiscount: {
        name: 'Golden Quarks Discount',
        description: 'This also reduces the cost to buy Golden Quarks in the shop by 1000 per level.',
        maxLevel: 25,
        costPerLevel: 500,
        minimumSingularity: 3,
        maxCapLevel: 50
    },
    singMaterialsExponent: {
        name: 'Materials Multiplier',
        description: 'Is it painful before Ascension? Increases Crystals, Mythos Shard, Particles and Constant by +100%. \nIncreases Ant ELO boosts +10. Increases Ant Sacrifice boosts +10%. Increase Building Power providing by (level / 100) ^ 3.',
        maxLevel: 1000,
        costPerLevel: 10,
        minimumSingularity: 4,
        maxCapLevel: 1000
    },
    singScoreExponent: {
        name: 'C15 Score Exponent',
        description: 'C15 Score Exponent ^ Level * 0.0001',
        maxLevel: 2500,
        costPerLevel: 100,
        minimumSingularity: 5,
        maxCapLevel: 5000
    },
    singAscendScoreExponent: {
        name: 'Ascension Score Exponent',
        description: 'Ascension Score ^ Level * 0.0001',
        maxLevel: 2000,
        costPerLevel: 1000,
        minimumSingularity: 6,
        maxCapLevel: 5000
    },
    singConstantExponent: {
        name: 'Singularity Constant Exponent',
        description: 'Constant ^ Level * 0.0001',
        maxLevel: 500,
        costPerLevel: 10000,
        minimumSingularity: 7,
        maxCapLevel: 2000
    },
    singAscendTimeExponent: {
        name: 'Ascension Time Exponent',
        description: 'Ascension Speed Multiplier ^ Level * 0.0001',
        maxLevel: 1000,
        costPerLevel: 100000,
        minimumSingularity: 8,
        maxCapLevel: 5000
    },
    singBuildingExponent: {
        name: 'Building Exponent',
        description: 'Tax is divided by Building Power ^ Level * 0.0001',
        maxLevel: 150,
        costPerLevel: 1000000,
        minimumSingularity: 9,
        maxCapLevel: 1000
    },
    singExponent: {
        name: 'Singularity Exponent',
        description: 'Set the constraint by Singularity to Exponent ^ 1 / (Level * 0.001 + 1) and Divide everything by 1 / (1 + level * 0.01) when you own the Antiquities of Ant God.',
        maxLevel: 100,
        costPerLevel: 10000000,
        minimumSingularity: 10
    },
    singWormhole: {
        name: 'Singularity Wormhole',
        description: 'Purchasing will increase the maximum level of Antiquities of Ant God.\n When purchased, it allows to specify multiple Singularities for one Singularity execution. And can goto freely in the future and the past!',
        maxLevel: 10,
        costPerLevel: 100000000,
        minimumSingularity: 10
    },
    singMaxLevelUp: {
        name: 'Singularity of Ant God',
        description: 'Increases the Singularity Count 1% (There is a maximum level limit for each) to the maximum level of all Singularity levels 2 and above.\nYou can enjoy inflation until you finally break Synergism!',
        maxLevel: 0.5,
        costPerLevel: 1000000000,
        minimumSingularity: 10
    },
    singularityOfSingularity: {
        name: 'Sing Sing',
        description: 'This is an option to devote your life to Synergism. Never do it.',
        maxLevel: 0.5,
        costPerLevel: 0,
        maxCapLevel: 1,
        minimumSingularity: 50
    },
    singsingWormhole: {
        name: 'Sing Sing Wormhole',
        description: 'Unknown effect',
        maxLevel: 0.01,
        costPerLevel: 1000000000000000,
        minimumSingularity: 5000
    }
}

export const checkUpgrades = () => {
    const singularityUpgrades = Object.keys(player.singularityUpgrades) as (keyof Player['singularityUpgrades'])[];
    for (const key of singularityUpgrades) {
        const obj = player.singularityUpgrades[`${key}`];
        if (isNaN(obj.level) || obj.level < 1) {
            obj.level = 0;
        }
        if (isNaN(obj.goldenQuarksInvested) || obj.goldenQuarksInvested < 0) {
            obj.goldenQuarksInvested = 0;
        }
        if ((obj.maxLevel !== -1 && obj.level > obj.maxCapLevel) || Math.round(obj.goldenQuarksInvested) !== Math.round(((obj.level + 1) * obj.level / 2) * obj.costPerLevel)) {
            obj.refund();
            void Notification(`sorry! ${obj.name} for Singularity Upgrades has been refund as the cost has changed with the update!`, 60000);
        }
    }
}

export const getGoldenQuarkCost = () => {
    const baseCost = 100000

    let costReduction = 0
    costReduction += 2 * Math.min(player.achievementPoints, 5000)
    costReduction += 1 * Math.max(0, player.achievementPoints - 5000)
    costReduction += player.cubeUpgrades[60]
    costReduction += 500 * player.singularityUpgrades.goldenQuarks1.level
    costReduction += 200 * player.singularityUpgrades.goldenQuarks2.level
    costReduction += 1000 * player.singularityUpgrades.goldenQuarks3.level

    costReduction += 1000 * player.singularityUpgrades.singGQdiscount.level
    costReduction += player.singularityCount * 100

    if (baseCost - costReduction < 1000) {
        costReduction = baseCost - 1000
    }

    return {
        cost: baseCost - costReduction,
        costReduction: costReduction
    }

}

export async function buyGoldenQuarks() {
    const goldenQuarkCost = getGoldenQuarkCost()
    const maxBuy = Math.floor(+player.worlds / goldenQuarkCost.cost)
    let buyAmount = null

    if (maxBuy === 0) {
        return Alert('Sorry, I can\'t give credit. Come back when you\'re a little... mmm... richer!')
    }

    const buyPrompt = await Prompt(`You can buy golden quarks here for ${format(goldenQuarkCost.cost)} Quarks (Discounted by ${format(goldenQuarkCost.costReduction)})! You can buy up to ${format(maxBuy, 0, true)}. How many do you want? Type -1 to buy max!`)
    if (buyPrompt === null) { // Number(null) is 0. Yeah..
        return Alert('Okay, maybe next time.');
    }

    buyAmount = Number(buyPrompt)
    //Check these lol
    if (Number.isNaN(buyAmount) || !Number.isFinite(buyAmount)) { // nan + Infinity checks
        return Alert('Value must be a finite number!');
    } else if (buyAmount <= 0 && buyAmount != -1) { // 0 or less selected
        return Alert('You can\'t craft a nonpositive amount of these, you monster!');
    } else if (buyAmount > maxBuy) {
        return Alert('Sorry, I cannnot sell you this many golden quarks! Try buying fewer of them or typing -1 to buy max!')
    } else if (Math.floor(buyAmount) !== buyAmount) { // non integer
        return Alert('Sorry. I only sell whole Golden Quarks. None of that fractional transaction!')
    }

    if (buyAmount === -1) {
        const cost = maxBuy * goldenQuarkCost.cost
        player.worlds.sub(cost)
        player.goldenQuarks += maxBuy
        return Alert(`Transaction of ${format(maxBuy, 0, true)} golden quarks successful! [-${format(cost,0,true)} Quarks]`)
    } else {
        const cost = buyAmount * goldenQuarkCost.cost
        player.worlds.sub(cost)
        player.goldenQuarks += buyAmount
        return Alert(`Transaction of ${format(buyAmount, 0, true)} golden quarks successful! [-${format(cost, 0, true)} Quarks]`)
    }
}

export type SingularityDebuffs = 'Offering' | 'Obtainium' | 'Global Speed' | 'Researches' | 'Ascension Speed' | 'Cubes' | 'Cube Upgrades'

export const calculateSingularityDebuff = (debuff: SingularityDebuffs) => {
    if (player.singularityCount === 0) {
        return 1
    }
    if (player.runelevels[6] > 0) {
        return 1 / (1 + player.singularityUpgrades.singExponent.level / 100)
    }

    let effectiveSingularities = player.singularityCount;
    effectiveSingularities *= Math.min(4.75, 0.75 * player.singularityCount / 10 + 1)
    if (player.singularityCount > 10) {
        effectiveSingularities *= 1.5
        effectiveSingularities *= Math.min(4, 1.25 * player.singularityCount / 10 - 0.25)
    }
    if (player.singularityCount > 25) {
        effectiveSingularities *= 2
        effectiveSingularities *= Math.min(4, 1.5 * player.singularityCount / 25 - 0.5)
    }
    if (player.singularityCount > 50) {
        effectiveSingularities *= 4
        effectiveSingularities *= Math.min(4, 2 * player.singularityCount / 50 - 1)
    }
    if (player.singularityCount > 100) {
        effectiveSingularities *= player.singularityCount / 25
    }
    if (player.singularityCount > 250) {
        effectiveSingularities *= player.singularityCount / 62.5
    }

    effectiveSingularities = Math.pow(effectiveSingularities, 1 / (1 + player.singularityUpgrades.singExponent.level / 1000))

    if (player.ascensionCount < 5) {
        effectiveSingularities = Math.pow(effectiveSingularities, 0.5 + player.ascensionCount * 0.1)
    }

    if (debuff === 'Offering') {
        return Math.sqrt(effectiveSingularities + 1)
    } else if (debuff === 'Global Speed') {
        return 1 + Math.sqrt(effectiveSingularities) / 4
    } else if (debuff === 'Obtainium') {
        return Math.sqrt(effectiveSingularities + 1)
    } else if (debuff === 'Researches') {
        return 1 + Math.sqrt(effectiveSingularities) / 2
    } else if (debuff === 'Ascension Speed') {
        return 1 + Math.sqrt(effectiveSingularities) / 5
    } else if (debuff === 'Cubes') {
        return 1 + (player.ascensionCount > 0 ? Math.sqrt(effectiveSingularities) / 4 : 0)
    } else { // Cube upgrades
        return Math.cbrt(effectiveSingularities + 1)
    }
}

export const singularityOverride = (hold: Player) => {

    if (player.singularityCount > player.singularityMaxCount) {
        player.singularityMaxCount = player.singularityCount
    }

    // Necessary for NaN measures and no 90 days
    hold.ascensionCounter = -1

    hold.dayCheck = player.dayCheck

    hold.singsing = player.singsing
    hold.saveString = player.saveString
    hold.shopExpandCount = player.shopExpandCount
    hold.theme = player.theme
    hold.lastCode = player.lastCode
    hold.hotkeys = Object.assign(hold.hotkeys, player.hotkeys)

    hold.dailyCheating = player.dailyCheating
    hold.timerCheating = player.timerCheating

    hold.dailyPowderResetUses = Math.max(Math.min(hold.dailyPowderResetUses, player.singularityUpgrades.singOverfluxPowder.level + 1), player.dailyPowderResetUses)

    const power = player.singularityUpgrades.singAutomation.level * Math.pow(player.singularityCount, 2);
    const cUnlocks = player.singularityUpgrades.corruptionFourteen.level > 0 || player.singularityUpgrades.corruptionFifteen.level > 0;

    if (power <= 0 || !isFinite(power)) {
        return;
    }

    const powerUnlock = power / Math.random()
    if (player.singularityCount >= 1 && powerUnlock > 100) {
        hold.unlocks.prestige = true
        hold.prestigeCount = 1
    }
    if (player.singularityCount >= 1 && hold.unlocks.prestige && powerUnlock > 500) {
        hold.unlocks.transcend = true
        hold.transcendCount = 1
    }
    if (player.singularityCount >= 1 && hold.unlocks.transcend && powerUnlock > 3000) {
        hold.unlocks.reincarnate = true
        hold.reincarnationCount = 1
    }
    if (player.singularityCount >= 1 && hold.unlocks.reincarnate && powerUnlock > 100000) {// Ascension
        hold.achievements[141] = player.achievements[141]
        hold.achievements[183] = player.achievements[183]
        hold.ascensionCount = Math.floor(powerUnlock / 100000)
    }

    hold.ascensionCount += Math.floor(player.ascensionCount * player.platonicUpgrades[25] / 100)

    if (power > 10) { // other settings
        hold.historyShowPerSecond = player.historyShowPerSecond
    }

    if (power > 10) { // Building toggle settings
        Object.assign(hold.toggles, player.toggles)
        Object.assign(hold.autoTesseracts, player.autoTesseracts)
    }

    if (power > 20) { // Toggle amount to buy settings
        hold.coinbuyamount = player.coinbuyamount
        hold.crystalbuyamount = player.crystalbuyamount
        hold.mythosbuyamount = player.mythosbuyamount
        hold.particlebuyamount = player.particlebuyamount
        hold.offeringbuyamount = player.offeringbuyamount
        hold.tesseractbuyamount = player.tesseractbuyamount
        hold.singupgradebuyamount = player.singupgradebuyamount
    }

    if (power > 30) { // Blessings and Spirits settings
        hold.runeBlessingBuyAmount = player.runeBlessingBuyAmount
        hold.runeSpiritBuyAmount = player.runeSpiritBuyAmount
    }

    if (power > 50) { // Reset toggle settings
        hold.resettoggle1 = player.resettoggle1
        hold.transcendamount = player.prestigeamount
        hold.resettoggle2 = player.resettoggle2
        hold.transcendamount = player.transcendamount
        hold.resettoggle3 = player.resettoggle3
        hold.reincarnationamount = player.reincarnationamount
    }

    if (power > 70) { // shop
        hold.shopBuyMax = player.shopBuyMax
        hold.shopConfirmation = player.shopConfirmation
    }

    if (power > 100) { // Ant Buy Max and Auto Runes
        hold.antMax = player.antMax
        hold.autoSacrificeToggle = player.autoSacrificeToggle // Auto Runes
    }

    if (power > 200) { // talismans
        Object.assign(hold.talismanOne, player.talismanOne)
        Object.assign(hold.talismanTwo, player.talismanTwo)
        Object.assign(hold.talismanThree, player.talismanThree)
        Object.assign(hold.talismanFour, player.talismanFour)
        Object.assign(hold.talismanFive, player.talismanFive)
        Object.assign(hold.talismanSix, player.talismanSix)
        Object.assign(hold.talismanSeven, player.talismanSeven)
        hold.autoFortifyToggle = player.autoFortifyToggle // Auto Fortify
        hold.autoEnhanceToggle = player.autoEnhanceToggle // Auto Enhance
    }

    if (cUnlocks && power > 500) { // Corruption Loadouts
        Object.assign(hold.corruptionLoadouts, player.corruptionLoadouts)
        Object.assign(hold.corruptionLoadoutNames, player.corruptionLoadoutNames)
    }

    if (power > 700) { // Auto Ant Sacrifice settings
        hold.autoAntSacrifice = player.autoAntSacrifice
        hold.autoAntSacrificeMode = player.autoAntSacrificeMode
        hold.autoAntSacTimer = player.autoAntSacTimer
    }

    if (power > 1000) { // Auto Cubes
        hold.buyMaxCubeUpgrades = player.buyMaxCubeUpgrades
        hold.buyAutoCubeUpgrades = player.buyAutoCubeUpgrades
        hold.autoOpenCubes = player.autoOpenCubes
        hold.tesseractAutoBuyer = player.tesseractAutoBuyer
        hold.autoBuyPlatonic = player.autoBuyPlatonic
    }

    if (power > 1200) { // Auto Ascend
        hold.autoAscend = player.autoAscend
        hold.autoAscendMode = player.autoAscendMode
        hold.ascensionamount = player.ascensionamount
        hold.autoAscendThreshold = player.autoAscendThreshold
    }

    if (power > 1500) { // Auto challenge settings
        hold.autoChallengeRunning = player.autoChallengeRunning
        hold.autoChallengeStartExponent = player.autoChallengeStartExponent
        hold.retrychallenges = player.retrychallenges
        Object.assign(hold.autoChallengeToggles, player.autoChallengeToggles);
        Object.assign(hold.autoChallengeTimer, player.autoChallengeTimer);
    }

    if (power > 2000) { // Auto Research settings
        hold.autoResearchToggle = player.autoResearchToggle
        hold.autoResearchMode = player.autoResearchMode
        hold.maxbuyresearch = player.maxbuyresearch
        hold.autoResearch = 0
    }

    if (power > 3000) { // Auto Tesseracts
        hold.tesseractAutoBuyerToggle = player.tesseractAutoBuyerToggle
        hold.tesseractAutoBuyerAmount = player.tesseractAutoBuyerAmount
    }

    if (power / Math.random() > 30) { // Auto Coin Buildings
        hold.upgrades[101] = player.upgrades[101]
        hold.upgrades[102] = player.upgrades[102]
        hold.upgrades[103] = player.upgrades[103]
        hold.upgrades[104] = player.upgrades[104]
        hold.upgrades[105] = player.upgrades[105]
    }

    if (power / Math.random() > 50) { // Accelerators
        hold.upgrades[86] = player.upgrades[86]
    }

    if (power / Math.random() > 70) { // Multipliers
        hold.upgrades[87] = player.upgrades[87]
    }

    if (power / Math.random() > 100) { // Autobuyer Coin Buildings
        hold.achievements[4] = player.achievements[4]
        hold.achievements[11] = player.achievements[11]
        hold.achievements[18] = player.achievements[18]
        hold.achievements[25] = player.achievements[25]
        hold.achievements[32] = player.achievements[32]
    }

    if (power / Math.random() > 150) { // Automatic Coin Upgrades for special
        hold.upgrades[91] = player.upgrades[91]
    }

    if (power / Math.random() > 200) { // Auto Diamond Buildings
        hold.upgrades[81] = player.upgrades[81]
        hold.upgrades[82] = player.upgrades[82]
        hold.upgrades[83] = player.upgrades[83]
        hold.upgrades[84] = player.upgrades[84]
        hold.upgrades[85] = player.upgrades[85]
    }

    if (power / Math.random() > 220) { // Automatic Diamond Upgrades for special
        hold.upgrades[92] = player.upgrades[92]
    }

    if (hold.unlocks.prestige && power / Math.random() > 250) { // Automatic Prestige
        hold.achievements[43] = player.achievements[43]
    }

    if (power / Math.random() > 300) { // Duplication Rune
        hold.achievements[38] = player.achievements[38]
    }

    if (power / Math.random() > 350) { // Transcend Accelerator Boost
        hold.upgrades[88] = player.upgrades[88]
    }

    if (hold.unlocks.prestige && power / Math.random() > 400) { // Autobuyer Diamond Buildings
        hold.achievements[78] = player.achievements[78]
        hold.achievements[85] = player.achievements[85]
        hold.achievements[92] = player.achievements[92]
        hold.achievements[99] = player.achievements[99]
        hold.achievements[106] = player.achievements[106]
    }

    if (hold.unlocks.prestige && power / Math.random() > 450) { // Autobuyer Crystal Upgrade
        hold.achievements[79] = player.achievements[79]
        hold.achievements[86] = player.achievements[86]
        hold.achievements[93] = player.achievements[93]
        hold.achievements[100] = player.achievements[100]
        hold.achievements[107] = player.achievements[107]
    }

    if (power / Math.random() > 500) { // Multipliers
        hold.achievements[80] = player.achievements[80]
    }

    if (power / Math.random() > 600) { // Accelerators
        hold.achievements[87] = player.achievements[87]
    }

    if (power / Math.random() > 700) { // Prism Rune
        hold.achievements[44] = player.achievements[44]
    }

    if (power / Math.random() > 800) { // Automatic Transcensions
        hold.upgrades[89] = player.upgrades[89]
    }

    if (power / Math.random() > 900 || Math.random() < 0.1) { // Automatic Generator Shop
        hold.upgrades[90] = player.upgrades[90]
    }

    if (hold.unlocks.transcend && power / Math.random() > 1000) { // Auto Mythos Buildings
        hold.upgrades[94] = player.upgrades[94]
        hold.upgrades[95] = player.upgrades[95]
        hold.upgrades[96] = player.upgrades[96]
        hold.upgrades[97] = player.upgrades[97]
        hold.upgrades[98] = player.upgrades[98]
    }

    if (hold.unlocks.transcend && power / Math.random() > 1200) { // Diamond per second
        hold.upgrades[93] = player.upgrades[93]
    }

    if (hold.unlocks.transcend && power / Math.random() > 2000) { // Mythos Upgrades
        hold.upgrades[99] = player.upgrades[99]
    }

    if (hold.unlocks.transcend && power / Math.random() > 2300) { // Mythos per second
        hold.upgrades[100] = player.upgrades[100]
    }

    if (hold.achievements[120] && power / Math.random() > 2500) { // 10 Complete C7 Unlock 5 new researches
        hold.achievements[124] = player.achievements[124]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 3000) { // Atomic production
        hold.achievements[50] = player.achievements[50]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 3500) { // Reincarnations Accelerator Boost
        hold.researches[41] = player.researches[41]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 4000) { // Reincarnations Generators
        hold.researches[42] = player.researches[42]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 4500) { // Reincarnations Coin Upgrades
        hold.researches[43] = player.researches[43]
    }

    if (hold.unlocks.reincarnate && hold.achievements[106] && power / Math.random() > 5000) { // Complete C6
        hold.achievements[113] = player.achievements[113]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 6000) { // Particles Upgrades
        hold.researches[47] = player.researches[47]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 7000) { // Automatic Reincarnate
        hold.researches[46] = player.researches[46]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 8000) { // Reincarnations Diamond Upgrades
        hold.researches[44] = player.researches[44]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 9000) { // Reincarnations Diamond Buildings
        hold.researches[45] = player.researches[45]
    }

    if (hold.achievements[113] && power / Math.random() > 10000) { // Complete C7
        hold.achievements[120] = player.achievements[120]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 12000) { // Reincarnation upgrades 1
        hold.researches[47] = player.researches[47]
        hold.researches[48] = player.researches[48]
        hold.researches[49] = player.researches[49]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 13000) { // Thrift Rune
        hold.achievements[102] = player.achievements[102]
    }

    if (hold.achievements[120] && power / Math.random() > 14000) { // Unlock 5 new researches
        hold.achievements[124] = player.achievements[124]
    }

    if (hold.achievements[120] && power / Math.random() > 15000) { // Complete C8 Unlock 20 new researches
        hold.achievements[127] = player.achievements[127]
    }

    if (hold.researches[49] && power / Math.random() > 17000) { // Reincarnation upgrades 2
        hold.researches[50] = player.researches[50]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 20000) { // Auto Ant Buy 1
        hold.achievements[176] = player.achievements[176]
        hold.achievements[177] = player.achievements[177]
        hold.achievements[178] = player.achievements[178]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 25000) { // Superior Intellect Rune
        hold.researches[82] = player.researches[82]
    }

    if (hold.achievements[120] && power / Math.random() > 30000) { // Complete C9 Unlock 10 new researches
        hold.achievements[134] = player.achievements[134]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 35000) { // Auto Ant Obtainium
        hold.researches[61] = player.researches[61]
    }

    if (hold.achievements[176] && power / Math.random() > 40000) { // Auto Ant Buy 2
        hold.achievements[179] = player.achievements[179]
        hold.achievements[180] = player.achievements[180]
        hold.achievements[181] = player.achievements[181]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 50000) { // Ant Sacrifice
        hold.achievements[173] = player.achievements[173]
    }

    if (hold.unlocks.reincarnate && power / Math.random() > 60000) { // Auto Ant Sacrifice
        hold.researches[124] = player.researches[124]
    }

    if (hold.achievements[179] && power / Math.random() > 70000) { // Auto Ant Buy 3
        hold.achievements[182] = player.achievements[182]
        hold.achievements[145] = player.achievements[145]
    }

    if (hold.achievements[141] && power / Math.random() > 80000) { // Ascension Particle Upgrades
        hold.cubeUpgrades[8] = player.cubeUpgrades[8]
    }

    if (hold.achievements[141] && power / Math.random() > 90000) { // Auto challenge
        hold.researches[150] = player.researches[150]
    }

    if (hold.achievements[141] && power / Math.random() > 100000) { // Auto Research
        hold.cubeUpgrades[9] = player.cubeUpgrades[9]
        hold.autoResearchToggle = !player.autoResearchToggle
        setTimeout(toggleAutoResearch, 1000); // Need to be done due to a bug
    }

    if (hold.achievements[141] && power / Math.random() > 110000) { // Ascension Automation upgrades
        hold.cubeUpgrades[4] = player.cubeUpgrades[4]
        hold.cubeUpgrades[5] = player.cubeUpgrades[5]
        hold.cubeUpgrades[6] = player.cubeUpgrades[6]
    }

    if (hold.achievements[141] && power / Math.random() > 120000) { // Auto Particle Buildings
        hold.cubeUpgrades[7] = player.cubeUpgrades[7]
    }

    if (hold.achievements[141] && power / Math.random() > 130000) { // Auto Fortify
        hold.researches[130] = player.researches[130]
    }

    if (hold.achievements[141] && power / Math.random() > 140000) { // Auto Enhance
        hold.researches[135] = player.researches[135]
    }

    if (hold.achievements[141] && power / Math.random() > 150000) { // Complete C11 and Unlock Tesseract Gifts
        hold.achievements[197] = player.achievements[197]
        hold.challengecompletions[11] = 1
    }

    if (hold.achievements[141] && power / Math.random() > 160000) { // Automatic Ascensions
        hold.cubeUpgrades[10] = player.cubeUpgrades[10]
    }

    if (hold.achievements[141] && power / Math.random() > 170000) { // start with 1 of each reincarnation building
        hold.cubeUpgrades[27] = player.cubeUpgrades[27]
        hold.firstOwnedParticles = 1;
        hold.secondOwnedParticles = 1;
        hold.thirdOwnedParticles = 1;
        hold.fourthOwnedParticles = 1;
        hold.fifthOwnedParticles = 1;
    }

    if (hold.achievements[197] && power / Math.random() > 180000) { // Complete C12 and Unlock Spirits
        hold.achievements[204] = player.achievements[204]
        hold.challengecompletions[12] = 1
    }

    if (hold.achievements[141] && power / Math.random() > 190000) { // Tesseract Buildings
        hold.ascendBuilding1.owned = 1
    }

    if (hold.achievements[141] && power / Math.random() > 200000) { // Auto Runes
        hold.cubeUpgrades[20] = player.cubeUpgrades[20]
    }

    if (hold.achievements[141] && power / Math.random() > 220000) { // Reincarnation per second
        hold.cubeUpgrades[28] = player.cubeUpgrades[28]
    }

    if (hold.ascendBuilding1.owned > 0 && power / Math.random() > 230000) { // Tesseract Buildings
        hold.ascendBuilding2.owned = 1
    }

    if (hold.achievements[141] && power / Math.random() > 240000) { // First five challenges 9,001 times
        hold.researches[105] = player.researches[105]
    }

    if (hold.achievements[127] && power / Math.random() > 250000) { // Gain 1 of each challenge 6-8 completion
        hold.cubeUpgrades[49] = player.cubeUpgrades[49]
        hold.challengecompletions[6] = hold.highestchallengecompletions[6] = hold.cubeUpgrades[49]
        hold.challengecompletions[7] = hold.highestchallengecompletions[7] = hold.cubeUpgrades[49]
        hold.challengecompletions[8] = hold.highestchallengecompletions[8] = hold.cubeUpgrades[49]
    }

    if (hold.achievements[141] && power / Math.random() > 260000) { // Automatically gain Mortuus Est Ant levels
        hold.researches[145] = player.researches[145]
    }

    if (hold.achievements[204] && power / Math.random() > 280000) { // Complete C13 and Hypercube Benedictions
        hold.achievements[211] = player.achievements[211]
        hold.challengecompletions[13] = 1
    }

    if (hold.ascendBuilding2.owned > 0 && power / Math.random() > 290000) { // Tesseract Buildings
        hold.ascendBuilding3.owned = 1
    }

    if (hold.achievements[141] && power / Math.random() > 300000) { // Automatically buy Constant Upgrades
        hold.researches[175] = player.researches[175]
    }

    if (hold.ascendBuilding3.owned > 0 && power / Math.random() > 330000) { // Tesseract Buildings
        hold.ascendBuilding4.owned = 1
    }

    if (hold.achievements[141] && power / Math.random() > 350000) { // Auto Tesseracts
        hold.researches[190] = player.researches[190]
    }

    if (hold.ascendBuilding4.owned > 0 && power / Math.random() > 380000) { // Tesseract Buildings
        hold.ascendBuilding5.owned = 1
    }

    if (hold.achievements[211] && power / Math.random() > 400000) { // Complete C14 and Platonic Statues and Challenge 15/Platonic Upgrades
        hold.achievements[218] = player.achievements[218]
        hold.challengecompletions[14] = 1
    }

    if (hold.achievements[134] && power / Math.random() > 450000) { // Gain 1 of each challenge 9 completion
        hold.challengecompletions[9] = hold.highestchallengecompletions[9] = 1
    }

    if (hold.achievements[141] && power / Math.random() > 500000) { // One of the first Abyss
        hold.hepteractCrafts.abyss.BAL = 1
    }

    if (hold.achievements[141] && power / Math.random() > 500000) { // When you ascend, start with 1 worker ant
        hold.cubeUpgrades[48] = player.cubeUpgrades[48]
    }

    if (hold.achievements[141] && power / Math.random() > 500000) { // r8x25
        hold.researches[200] = Math.floor(Math.min(player.researches[200], Math.pow(power / 500000, 3)))
    }

    if (hold.achievements[141] && power / Math.random() > 500000) { // w5x10
        hold.cubeUpgrades[50] = Math.floor(Math.min(player.cubeUpgrades[50], Math.pow(power / 500000, 3)))
    }

    if (hold.achievements[218] && power / Math.random() > 600000) { // Automatic purchase of Blessings
        hold.achievements[222] = player.achievements[222]
    }

    if (hold.achievements[211] && power / Math.random() > 700000) { // Automatic purchase of Talisman Fragments
        hold.achievements[215] = player.achievements[215]
    }

    if (power / Math.random() > 1000000) { // Cx1
        hold.cubeUpgrades[51] = player.cubeUpgrades[51]
        if (hold.cubeUpgrades[51]) {
            for (const i of cubeAutomationIndices.values()) {
                hold.cubeUpgrades[i] = getCubeMax(i);
            }
            for (const i of researchAutomationIndices.values()) {
                hold.researches[i] = G['researchMaxLevels'][i];
            }
        }
    }

    if (hold.achievements[141] && power / Math.random() > 1000000) { // Overflux Powder
        hold.overfluxPowder += Math.floor(powerUnlock / 100000)
    }

    if (hold.achievements[141] && power / Math.random() > 1000000) { // Inherit some achievements that are not easy to unlock
        const achRequirements = [36, 37, 38, 39, 40, 41, 42, 60, 57, 61, 58, 62, 59, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252]
        for (let j = 0; j < achRequirements.length; j++) {
            hold.achievements[achRequirements[j]] = player.achievements[achRequirements[j]]
        }
    }

    if (hold.achievements[218] && power > 1000000) { // C15 Exponent
        hold.challenge15Exponent = Math.pow(power / 1000000, 4)
    }

    if (hold.achievements[218] && power / Math.random() > 1500000) { // Platonic Upgrade 5
        hold.platonicUpgrades[5] = player.platonicUpgrades[5]
    }

    if (hold.achievements[218] && power > 2000000) { // Hepteract Unlock 1
        hold.hepteractCrafts.chronos.UNLOCKED = player.hepteractCrafts.chronos.UNLOCKED
        hold.hepteractCrafts.hyperrealism.UNLOCKED = player.hepteractCrafts.hyperrealism.UNLOCKED
        hold.hepteractCrafts.quark.UNLOCKED = player.hepteractCrafts.quark.UNLOCKED
        hold.hepteractCrafts.challenge.UNLOCKED = player.hepteractCrafts.challenge.UNLOCKED
    }

    if (hold.achievements[218] && power > 3000000) { // Increase the first cap of hepteract
        const hepteractCrafts = Object.keys(player.hepteractCrafts) as (keyof Player['hepteractCrafts'])[];
        for (const key of hepteractCrafts) {
            if (key !=='quark') {
                hold.hepteractCrafts[key].CAP = Math.round(1000 * Math.pow(2, player.singularityUpgrades.singCraftExpand.level + Math.max(0, Math.log10(power) - 6)));
            }
        }
    }

    if (hold.platonicUpgrades[5] && power / Math.random() > 4000000) { // Platonic Upgrade 10
        hold.platonicUpgrades[10] = player.platonicUpgrades[10]
    }

    if (hold.achievements[218] && power > 5000000) { // Hepteract Unlock 2
        hold.hepteractCrafts.abyss.UNLOCKED = player.hepteractCrafts.abyss.UNLOCKED
        hold.hepteractCrafts.accelerator.UNLOCKED = player.hepteractCrafts.accelerator.UNLOCKED
        hold.hepteractCrafts.acceleratorBoost.UNLOCKED = player.hepteractCrafts.acceleratorBoost.UNLOCKED
        hold.hepteractCrafts.multiplier.UNLOCKED = player.hepteractCrafts.multiplier.UNLOCKED
    }

    if (hold.platonicUpgrades[10] && power / Math.random() > 7000000) { // Platonic Upgrade 15
        hold.platonicUpgrades[15] = player.platonicUpgrades[15]
    }

    if (hold.achievements[218] && power > 10000000) { // Full achievement inheritance
        for (let j = 0; j < player.achievements.length; j++) {
            const power2 = power / Math.random()
            if (!hold.achievements[j] && power2 > 1000000 * j) {
                hold.achievements[j] = player.achievements[j]
            }
        }
    }

    if (hold.achievements[218] && power > 30000000) { // Increase the first craft of hepteract
        const hepteractCrafts = Object.keys(player.hepteractCrafts) as (keyof Player['hepteractCrafts'])[];
        for (const key of hepteractCrafts) {
            if (key !=='quark') {
                hold.hepteractCrafts[key].BAL = hold.hepteractCrafts[key].CAP;
            }
        }
    }

    if (hold.platonicUpgrades[15] && power > 100000000) { // Platonic Upgrade 20
        hold.platonicUpgrades[20] = player.platonicUpgrades[20]
    }

    if (hold.cubeUpgrades[48] > 0) { // These are so powerful that I will limit them
        if (player.singularityCount >= 100) {
            hold.firstOwnedAnts += 1
        } else {
            hold.cubeUpgrades[48] = 1
        }
    }

    return hold;
}
