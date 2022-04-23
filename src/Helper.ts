import { sacrificeAnts } from "./Ants";
import { calculateAscensionAcceleration, calculateAutomaticObtainium, calculateMaxRunes, calculateObtainium, calculateTimeAcceleration } from "./Calculate"
import { quarkHandler } from "./Quark";
import { redeemShards } from "./Runes";
import { player } from "./Synergism";
import { visualUpdateResearch } from "./UpdateVisuals";
import { Globals as G } from './Variables';
import { buyTalismanResources } from "./Talismans";
import { buyAllBlessings } from "./Buy";

type TimerInput = 'prestige' | 'transcension' | 'reincarnation' | 'ascension' | 'quarks' | 'goldenQuarks';

/**
 * addTimers will add (in milliseconds) time to the reset counters, and quark export timer
 * @param input 
 * @param time 
 */
export const addTimers = (input: TimerInput, time = 0) => {
    const timeMultiplier = (input === "ascension" || input === "quarks" || input === "goldenQuarks") ? 1 : calculateTimeAcceleration();

    switch(input){
        case "prestige": {
            player.prestigecounter += time * timeMultiplier;
            break;
        }
        case "transcension": {
            player.transcendcounter += time * timeMultiplier;
            break;
        }
        case "reincarnation": {
            player.reincarnationcounter += time * timeMultiplier;
            break;
        }
        case "ascension": {
            player.ascensionCounter += time * timeMultiplier * calculateAscensionAcceleration();
            break;
        }
        case "quarks": {
            // First get maximum Quark Clock (25h, up to +25 from Research 8x20)
            const maxQuarkTimer = quarkHandler().maxTime
            player.quarkstimer += time * timeMultiplier;
            // Checks if this new time is greater than maximum, in which it will default to that time.
            // Otherwise returns itself.
            player.quarkstimer = (player.quarkstimer > maxQuarkTimer) ? maxQuarkTimer : player.quarkstimer;
            break;
        }
        case "goldenQuarks": {
            if (player.singularityUpgrades.goldenQuarks3.level === 0)
                return

            else {
                player.goldenQuarksTimer += time * timeMultiplier;
                player.goldenQuarksTimer = (player.goldenQuarksTimer > 90000) ? 90000 : player.goldenQuarksTimer;
            }
            break;
        }
    }
}

/**
 * checkMaxRunes returns how many unique runes are at the maximum level.
 * Does not take in params, returns a number equal to number of maxed runes.
 */
export const checkMaxRunes = () => {
    let maxed = 0;
    for (let i = 1; i <= 5; i++) {
        if (player.runelevels[i - 1] >= calculateMaxRunes(i))
            maxed++;
    }
    return maxed
}

type AutoToolInput = 'addObtainium' | 'addOfferings' | 'runeSacrifice' | 'antSacrifice';

/**
 * Assortment of tools which are used when actions are automated.
 * @param input 
 * @param time 
 */
export const automaticTools = (input: AutoToolInput, time: number) => {
    const timeMultiplier = (input === "runeSacrifice" || input === "addOfferings") ? 1 : calculateTimeAcceleration()

    switch(input){
        case "addObtainium": {
            //Update Obtainium Multipliers + Amount to gain
            calculateObtainium();
            const obtainiumGain = calculateAutomaticObtainium();
            //Add Obtainium
            player.researchPoints = Math.min(1e300, player.researchPoints + obtainiumGain * time * timeMultiplier);
            //Update visual displays if appropriate
            if (G['currentTab'] === "researches") {
                visualUpdateResearch();
            }
            break;
        }
        case "addOfferings":
            //This counter can be increased through challenge 3 reward
            //As well as cube upgrade 1x2 (2).
            G['autoOfferingCounter'] += time;
            //Any time this exceeds 1 it adds an offering
            player.runeshards = Math.min(1e300, player.runeshards + Math.floor(G['autoOfferingCounter']));
            G['autoOfferingCounter'] %= 1;
            break;
        case "runeSacrifice":
            //Every real life second this will trigger
            player.sacrificeTimer += time;
            if (player.sacrificeTimer >= 1 && isFinite(player.runeshards)){
                let kind = 0;
                if(player.challengecompletions[13] >= 60){
                    kind += 1;
                }
                if(player.challengecompletions[15] > 0){
                    kind += 1;
                }
                if(player.cubeUpgrades[20] === 1){
                    kind += 1;
                }
                kind *= 2; // Buy Offerings and Obtainium with 50% left

                if(kind > 0){
                    // Automatic purchase of Talisman Fragments
                    if(player.challengecompletions[13] >= 60){
                        const notMaxed = 7;
                        const talismanItemNames = ['shard','commonFragment','uncommonFragment','rareFragment','epicFragment','legendaryFragment','mythicalFragment'] as const;
                        for (let i = 0; i < notMaxed; i++) {
                            buyTalismanResources(talismanItemNames[i], 100 / kind / notMaxed);
                        }
                    }

                    // Automatic purchase of Blessings
                    if(player.challengecompletions[15] > 0){
                        buyAllBlessings('Blessings', 50 / kind);
                        buyAllBlessings('Spirits', 50 / kind);
                    }

                    // If you bought cube upgrade 2x10 then it sacrifices to all runes equally
                    if(player.cubeUpgrades[20] === 1){
                        if(kind === 2) {
                            kind = 1;
                        }
                        const notMaxed = (5 - checkMaxRunes());
                        if(notMaxed > 0){
                            const baseAmount = Math.floor(player.runeshards / kind / notMaxed);
                            for (let i = 0; i < 5; i++) {
                                redeemShards(i+1, true, baseAmount);
                            }
                        }
                    }
                    // If you did not buy cube upgrade 2x10 it sacrifices to selected rune.
                    else{
                        const rune = player.autoSacrifice;
                        redeemShards(rune, true, 0);
                    }
                }
                //Modulo used in event of a large delta time (this could happen for a number of reasons)
                player.sacrificeTimer %= 1
            }
            break;
        case "antSacrifice": {
            // Increments real and 'fake' timers. the Real timer is on real life seconds.
            player.antSacrificeTimer += time * timeMultiplier;
            player.antSacrificeTimerReal += time

            //Equal to real time iff "Real Time" option selected in ants tab.
            const antSacrificeTimer = (player.autoAntSacrificeMode === 2) ?
            player.antSacrificeTimerReal : player.antSacrificeTimer;

            if (antSacrificeTimer >= player.autoAntSacTimer && player.researches[124] === 1 
                && player.autoAntSacrifice && player.antPoints.gte("1e40")) {
                void sacrificeAnts(true)
            }
            break;
        }
    }
}
