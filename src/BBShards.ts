import { format, player } from './Synergism';
import { Alert, Prompt } from './UpdateHTML';
import type { IUpgradeData } from './DynamicUpgrade';
import { DynamicUpgrade } from './DynamicUpgrade';
import type { Player } from './types/Synergism';
import { DOMCacheGetOrSet } from './Cache/DOM';
import { updateSingularityPenalties } from './singularity';

export interface IBBShardData extends IUpgradeData {
    minimumSingularity?: number
    costFormula (level: number, baseCost: number): number
    bbshardsInvested?: number
}

export class BBShardUpgrade extends DynamicUpgrade {
    public minimumSingularity: number;
    readonly costFormula: (level: number, baseCost: number) => number
    public bbshardsInvested = 0

    constructor(data: IBBShardData) {
        super(data);
        this.minimumSingularity = data.minimumSingularity ?? 0;
        this.costFormula = data.costFormula;
        this.bbshardsInvested = data.bbshardsInvested ?? 0;
    }

    getCostTNL(): number {

        if (this.level === this.maxLevel) {
            return 0
        }

        return this.costFormula(this.level, this.costPerLevel)
    }

    /**
     * Buy levels up until togglebuy or maxxed.
     * @returns An alert indicating cannot afford, already maxxed or purchased with how many
     *          levels purchased
     */
    public async buyLevel(event: MouseEvent): Promise<void> {
        let purchased = 0;
        let maxPurchasable = 1;
        let OCTBudget = player.bbshards;

        if (event.shiftKey) {
            maxPurchasable = 100000
            const buy = Number(await Prompt(`How many BBShards would you like to spend? You have ${format(player.bbshards, 0, true)} OCT. Type -1 to use max!`))

            if (isNaN(buy) || !isFinite(buy) || !Number.isInteger(buy)) { // nan + Infinity checks
                return Alert('Value must be a finite number!');
            }

            if (buy === -1) {
                OCTBudget = player.bbshards
            } else if (buy <= 0) {
                return Alert('Purchase cancelled!')
            } else {
                OCTBudget = buy
            }
            OCTBudget = Math.min(player.bbshards, OCTBudget)
        }

        if (this.maxLevel > 0) {
            maxPurchasable = Math.min(maxPurchasable, this.maxLevel - this.level)
        }

        if (maxPurchasable === 0) {
            return Alert('hey! You have already maxxed this upgrade. :D')
        }

        if (player.highestSingularityCount < this.minimumSingularity) {
            return Alert('you\'re not powerful enough to purchase this yet.')
        }

        while (maxPurchasable > 0) {
            const cost = this.getCostTNL();
            if (player.bbshards < cost || OCTBudget < cost) {
                break;
            } else {
                player.bbshards -= cost;
                OCTBudget -= cost;
                this.bbshardsInvested += cost
                this.level += 1;
                purchased += 1;
                maxPurchasable -= 1;
            }
        }

        if (purchased === 0) {
            return Alert('You cannot afford this upgrade. Sorry!')
        }
        if (purchased > 1) {
            return Alert(`Purchased ${format(purchased)} levels, thanks to Multi Buy!`)
        }

        this.updateUpgradeHTML();
        updateSingularityPenalties();
        DOMCacheGetOrSet('bbshardAmount').innerHTML = `You have ${format(player.bbshards, 0, true)} BBShards`;
    }

    /**
     * Given an upgrade, give a concise information regarding its data.
     * @returns A string that details the name, description, level statistic, and next level cost.
     */
    toString(): string {
        const costNextLevel = this.getCostTNL();
        const maxLevel = this.maxLevel === -1
            ? ''
            : `/${format(this.maxLevel, 0 , true)}`;
        const color = this.maxLevel === this.level ? 'plum' : 'white';

        const minReqColor = player.highestSingularityCount < this.minimumSingularity ? 'crimson' : 'green';
        const minimumSingularity = this.minimumSingularity > 0
            ? `Minimum Singularity: ${this.minimumSingularity}`
            : 'No minimal Highest Singularity to purchase required'

        return `<span style="color: gold">${this.name}</span>
                <span style="color: lightblue">${this.description}</span>
                <span style="color: ${minReqColor}">${minimumSingularity}</span>
                <span style="color: ${color}"> Level ${format(this.level, 0, true)}${maxLevel}</span>
                <span style="color: gold">${this.getEffect().desc}</span>
                Cost for next level: ${format(costNextLevel, 0, true, true, true)} BBShards.
                Spent BBShards: ${format(this.bbshardsInvested, 0, true, true, true)}`
    }

    public updateUpgradeHTML(): void {
        DOMCacheGetOrSet('singularityBBShardMultiline').innerHTML = this.toString()
    }

    public computeFreeLevelSoftcap(): number {
        return Math.min(this.level, this.freeLevels) + Math.sqrt(Math.max(0, this.freeLevels - this.level))
    }

    public actualTotalLevels(): number {
        const linearLevels = this.level
        return linearLevels // There is currently no 'improvement' to oct free upgrades.
    }

    public getEffect(): { bonus: number | boolean, desc: string } {
        return this.effect(this.actualTotalLevels())
    }

}

export const bbshardData: Record<keyof Player['bbshardUpgrades'], IBBShardData> = {
    bbshardStarter: {
        name: 'BBShard Starter',
        description: 'Welcome to BBShards. The joke has finally come true. BBShards can only be obtained by the amount of Highest Singularities in Singularity Reset.\n Here we promise to reduce the Singularity Penalties exponent by 0.05.',
        costFormula: (level: number, baseCost: number) => {
            return (level >= 1 ? 250 : 1) * baseCost
        },
        maxLevel: 2,
        costPerLevel: 1,
        effect: (n: number) => {
            return {
                bonus: n * 0.05,
                desc: `Reduce the Singularity Penalties exponent by ${format(n * 0.05, 2, true)}.`
            }
        }
    },
    bbshardSingularityPenalties: {
        name: 'Singularity Penalties',
        description: 'Reduce the Singularity Penalties exponent by 0.01 per level.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost * (1 + level)
        },
        maxLevel: 40,
        costPerLevel: 10,
        effect: (n: number) => {
            return {
                bonus: n * 0.01,
                desc: `Reduce the Singularity Penalties exponent by ${format(n * 0.01, 2, true)}.`
            }
        }
    },
    bbshardSingularityTrail: {
        name: 'Singularity Trail',
        description: 'If the Singularity Count is lower than the Highest Singularity then divide the Singularity Penalties by 100% per level.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: -1,
        costPerLevel: 1,
        effect: (n: number) => {
            return {
                bonus: 1 + n,
                desc: `Divide the Singularity Penalties by ${format(n * 100, 2, true)}% per level.`
            }
        }
    },
    bbshardSingularityElevator: {
        name: 'Singularity Elevator',
        description: 'If Singularity Count is lower than the Highest Singularity, +1 is added to Singularity Count progression.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: -1,
        costPerLevel: 1,
        effect: (n: number) => {
            return {
                bonus: n,
                desc: `+${format(n, 0, true)} is added to Singularity Count progression.`
            }
        }
    },
    bbshardNoResetQuarks: {
        name: 'Quark Beyond Singularity',
        description: 'This will reduce the amount of Quarks you lose in Singularity by 10%. This is the power of science!',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 10,
        costPerLevel: 1,
        effect: (n: number) => {
            return {
                bonus: 0.1 * n,
                desc: `Reduce the amount of Quarks you lose in Singularity by ${format(n * 10, 0, true)}%`
            }
        }
    },
    bbshardDailyQuality: {
        name: 'Daily Quality',
        description: 'Increases the chance that each Upgrade with Daily Codes will be of higher quality. I\'m looking forward to seeing what\'s in the Daily!',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 20,
        costPerLevel: 1,
        effect: (n: number) => {
            return {
                bonus: 0.05 * n,
                desc: `${format(n * 5, 0, true)}% chance to roll again.`
            }
        }
    },
    bbshardDailyOcteract: {
        name: 'Daily Octeracts Upgrade',
        description: 'The type of free level earned in the daily code has a 10% increased chance of being an Octeracts upgrade instead of a Singularity upgrade.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 10,
        costPerLevel: 1,
        effect: (n: number) => {
            return {
                bonus: 0.1 * n,
                desc: `There is currently a ${format(n * 10, 0, true)}% chance.`
            }
        }
    },
    bbshardCubes: {
        name: 'BBShard Cubes',
        description: 'Increases all types of Cubes by +10%',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: -1,
        costPerLevel: 1,
        minimumSingularity: 150,
        effect: (n: number) => {
            return {
                bonus: 1 + 0.1 * n,
                desc: `Increases all types of Cubes by ${format(10 * n, 0, true)}%.`
            }
        }
    },
    bbshardAscensionSpeed: {
        name: 'BBShard Ascension Speed',
        description: 'Increases Ascension Speed by +10%',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: -1,
        costPerLevel: 1,
        minimumSingularity: 150,
        effect: (n: number) => {
            return {
                bonus: 1 + 0.1 * n,
                desc: `Increases Ascension Speed by ${format(10 * n, 0, true)}%.`
            }
        }
    },
    bbshardGlobalSpeed: {
        name: 'BBShard Global Speed',
        description: 'Greatly increases Global Speed',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: -1,
        costPerLevel: 1,
        minimumSingularity: 150,
        effect: (n: number) => {
            return {
                bonus: Math.pow(1 + 0.1 * n, Math.log2(10)),
                desc: `Increases Global Speed by x${format(Math.pow(1 + 0.1 * n, Math.log2(10)), 2, true)}.`
            }
        }
    },
    bbshardHeptUnlock: {
        name: 'bbshard Hepteract Forge Unlocks',
        description: 'As you level up, something unlocks. Find out',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 5,
        costPerLevel: 2,
        minimumSingularity: 150,
        effect: (n: number) => {
            return {
                bonus: n,
                desc: `${n} of something unlocked.`
            }
        }
    },
    bbshardHepteractForgePenaltie: {
        name: 'Hepteract Forge Cost',
        description: 'Reduce the Hepteract Forge costs are multiplied exponent by 0.1 per level',
        costFormula: (level: number, baseCost: number) => {
            return baseCost * (1 + level)
        },
        maxLevel: 10,
        costPerLevel: 1,
        minimumSingularity: 150,
        effect: (n: number) => {
            return {
                bonus: n / 10,
                desc: `Reduce the Hepteract Forge costs are multiplied exponent by ${format(n / 10, 1, true)}.`
            }
        }
    },
    bbshardQuark: {
        name: 'BBShard Quark',
        description: 'Increases Quark by +5%',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 100,
        costPerLevel: 1,
        minimumSingularity: 160,
        effect: (n: number) => {
            return {
                bonus: 1 + 0.05 * n,
                desc: `Increases Quark by ${format(5 * n, 0, true)}%.`
            }
        }
    },
    bbshardAscensionScore: {
        name: 'BBShard Ascension Score',
        description: '+10% more score on Ascensions per level',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 100,
        costPerLevel: 1,
        minimumSingularity: 170,
        effect: (n: number) => {
            return {
                bonus: 1 + 0.1 * n,
                desc: `Increases Ascension Score by ${format(10 * n, 0, true)}%.`
            }
        }
    },
    bbshardTimer: {
        name: 'BBShard Improvement Times',
        description: 'Increases DELTA and PHI max days and effectiveness rate by +10% per level.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 90,
        costPerLevel: 2,
        minimumSingularity: 180,
        effect: (n: number) => {
            return {
                bonus: 1 + 0.1 * n,
                desc: `Increases by ${format(10 * n, 0, true)}%.`
            }
        }
    },
    bbshardChallenge: {
        name: 'Challenge Caps',
        description: 'add +4 more Reincarnation Challenges and +2 Ascension Challenge to the cap, per level',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 15,
        costPerLevel: 1,
        minimumSingularity: 190,
        effect: (n: number) => {
            return {
                bonus: n,
                desc: `You feel motivated enough to complete ${format(n * 4, 0, true)} more Reincarnation Challenges, and ${format(n * 2, 0, true)} more Ascension Challenges.`
            }
        }
    },
    bbshardSingFastForward: {
        name: 'Singularity Forward',
        description: 'Advances all Singularity Count by +1. Adds +1 second to Ascension time when ascending',
        costFormula: (level: number, baseCost: number) => {
            return baseCost * (1 + level)
        },
        maxLevel: -1,
        costPerLevel: 1,
        minimumSingularity: 200,
        effect: (n: number) => {
            return {
                bonus: n,
                desc: `Advances all Singularity Count by ${format(n, 0, true)} and ${format(n, 0, true)} second to Ascension time when ascending.`
            }
        }
    },
    bbshardCorruption: {
        name: 'Corruptions',
        description: 'Adds one level to the cap on corruptions.',
        costFormula: (level: number, baseCost: number) => {
            return (level + 2) * (level + 1) / 2 * baseCost
        },
        maxLevel: 2,
        costPerLevel: 10,
        minimumSingularity: 220,
        effect: (n: number) => {
            return {
                bonus: n,
                desc: `Corruption level cap is increased by ${n}.`
            }
        }
    },
    bbshardAscensionEffective: {
        name: 'Ascension Score Boost',
        description: 'Effective Score drops to ^0.5 when Ascension Score is 1e23 or higher. Increase this by 0.001 per level.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost
        },
        maxLevel: 500,
        costPerLevel: 10,
        minimumSingularity: 250,
        effect: (n: number) => {
            return {
                bonus: n / 1000,
                desc: `An Effective Score of 1e23 or higher is now ^${format(0.5 + n / 1000, 3, true)}.`
            }
        }
    },
    bbshardAscensionSpeedPenaltie: {
        name: 'Ascension Speed Penaltie',
        description: 'Reduce the Ascension Speed is divided exponent by 0.01 per level',
        costFormula: (level: number, baseCost: number) => {
            return baseCost * (1 + level)
        },
        maxLevel: 30,
        costPerLevel: 2,
        minimumSingularity: 300,
        effect: (n: number) => {
            return {
                bonus: n / 100,
                desc: `Reduce the Ascension Speed is divided exponent by ${format(n / 100, 2, true)}.`
            }
        }
    },
    bbshardGQCubeBonus: {
        name: 'Golden Quark Profit',
        description: 'The amount of Golden Quarks you have increases all types of Cubes by a factor of ^+0.02 per level.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost * (1 + level)
        },
        maxLevel: 10,
        costPerLevel: 2,
        minimumSingularity: 350,
        effect: (n: number) => {
            return {
                bonus: Math.pow(1 + n / 50, Math.log10(Math.max(1, player.goldenQuarks))),
                desc: `Currently, all types of cubes have a multiplier of x${format(Math.pow(1 + n / 50, Math.log10(Math.max(1, player.goldenQuarks))), 3, true)}.`
            }
        }
    },
    bbshardOcteractASBonus: {
        name: 'Octeract Profit',
        description: 'The amount of Octeract you have increases Ascension Speed by a factor of ^+0.01 per level.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost * (1 + level)
        },
        maxLevel: 10,
        costPerLevel: 2,
        minimumSingularity: 400,
        effect: (n: number) => {
            return {
                bonus: Math.pow(1 + n / 100, Math.log10(Math.max(1, player.wowOcteracts))),
                desc: `Currently, Ascension Speed have a multiplier of x${format(Math.pow(1 + n / 100, Math.log10(Math.max(1, player.wowOcteracts))), 3, true)}.`
            }
        }
    },
    bbshardGlobalSpeedPenaltie: {
        name: 'Global Speed Penaltie',
        description: 'Reduce the Global Speed is divided exponent by 0.01 per level',
        costFormula: (level: number, baseCost: number) => {
            return baseCost * (1 + level)
        },
        maxLevel: 50,
        costPerLevel: 1,
        minimumSingularity: 450,
        effect: (n: number) => {
            return {
                bonus: n / 100,
                desc: `Reduce the Global Speed is divided exponent by ${format(n / 100, 2, true)}.`
            }
        }
    },
    bbshardAscensionSpeed2: {
        name: 'Ascension Speed Accelerator',
        description: 'Go beyond infinity. Ascension Speed is 1.1x per level.',
        costFormula: (level: number, baseCost: number) => {
            return baseCost * (1 + level) * Math.max(1, Math.pow(1.05, level) * 1e-20)
        },
        maxLevel: -1,
        costPerLevel: 1,
        minimumSingularity: 500,
        effect: (n: number) => {
            return {
                bonus: Math.pow(1.1, n),
                desc: `Ascension Speed increases by ${format(Math.pow(1.1, n), 2, true)}x.`
            }
        }
    }
}
