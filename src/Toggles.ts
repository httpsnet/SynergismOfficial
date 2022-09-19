import { revealStuff, hideStuff, updateChallengeDisplay, showCorruptionStatsLoadouts, changeTabColor, Prompt, Alert } from './UpdateHTML';
import { player, format, resetCheck } from './Synergism';
import { Globals as G } from './Variables';
import { visualUpdateCubes, visualUpdateOcteracts } from './UpdateVisuals';
import { calculateRuneLevels } from './Calculate';
import { reset, resetrepeat } from './Reset';
import { autoResearchEnabled } from './Research';
import { achievementaward } from './Achievements';
import { getChallengeConditions, autoAscensionChallengeSweepUnlock } from './Challenges';
import { corruptionDisplay, corruptionLoadoutTableUpdate, maxCorruptionLevel } from './Corruptions';
import type { BuildingSubtab, Player } from './types/Synergism';
import { DOMCacheGetOrSet } from './Cache/DOM';


interface TabValue { tabName: keyof typeof tabNumberConst, unlocked: boolean }
type Tab = Record<number, TabValue>;
type SubTab = Record<number, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tabSwitcher?: ((...args: any[]) => unknown) | ((...args: any[]) => Promise<unknown>)
    subTabList: {
        subTabID: string | number | boolean
        unlocked: boolean
        buttonID?: string
    }[]
}>

const tabNumberConst = {
    'settings': -1,
    'shop': 0,
    'buildings': 1,
    'upgrades': 2,
    'achievements': 3,
    'runes': 4,
    'challenges': 5,
    'researches': 6,
    'ants': 7,
    'cubes': 8,
    'traits': 9,
    'singularity': 10
} as const;

export const toggleTabs = (name: keyof typeof tabNumberConst) => {
    G['currentTab'] = name;
    player.tabnumber = tabNumberConst[name];

    revealStuff();
    hideStuff();

    const el = document.activeElement as HTMLElement | null;
    if (el !== null) {
        el.blur();
    }

    const subTabList = subTabsInMainTab(player.tabnumber).subTabList
    if (player.tabnumber !== -1) {
        for (let i = 0; i < subTabList.length; i++) {
            const id = subTabList[i].buttonID;
            if (id) {
                const button = DOMCacheGetOrSet(id) as HTMLElement | null;
                if (button !== null) {
                    if (button.style.backgroundColor === 'crimson') { // handles every tab except settings and corruptions
                        player.subtabNumber = i
                        break;
                    }
                    if (player.tabnumber === 9 && button.style.borderColor === 'dodgerblue') { // handle corruption tab
                        player.subtabNumber = i
                        break;
                    }
                }
            }
        }
    } else { // handle settings tab
        // The first getElementById makes sure that it still works if other tabs start using the subtabSwitcher class
        const btns = document.querySelectorAll('[id^="switchSettingSubTab"]');
        for (let i = 0; i < btns.length; i++) {
            if (btns[i].classList.contains('buttonActive')) {
                player.subtabNumber = i
                break;
            }
        }
    }
    toggleSubTab(player.tabnumber, player.subtabNumber)
}

export const toggleSettings = (toggle: HTMLElement) => {
    const toggleId = toggle.getAttribute('toggleId') || 1;
    if (player.toggles[+toggleId] === true) {
        player.toggles[+toggleId] = false;
    } else {
        player.toggles[+toggleId] = true;
    }
    const format = toggle.getAttribute('format') || 'Auto [$]';
    const finishedString = format.replace('$', player.toggles[+toggleId] ? 'ON' : 'OFF');
    toggle.textContent = finishedString;
    if (!toggle.classList.contains('noColor')) {
        toggle.style.border = '2px solid ' + (player.toggles[+toggleId] ? 'green' : 'red');
    }
    revealStuff();
}

export const toggleChallenges = (i: number, auto = false) => {
    if ((i <= 5)) {
        if (player.currentChallenge.ascension !== 15 || player.ascensionCounter >= 2 || player.ascensionCounterRealReal >= 2) {
            player.currentChallenge.transcension = i;
            reset('transcensionChallenge', false, 'enterChallenge');
            player.transcendCount -= 1;
            if (!player.currentChallenge.reincarnation && !document.querySelector('.resetbtn.hover')) {
                resetrepeat('transcensionChallenge');
            }
        }
    }
    if ((i >= 6 && i < 11)){
        if (player.currentChallenge.ascension !== 15 || player.ascensionCounter >= 2 || player.ascensionCounterRealReal >= 2) {
            player.currentChallenge.reincarnation = i;
            reset('reincarnationChallenge', false, 'enterChallenge');
            player.reincarnationCount -= 1;
            if (!document.querySelector('.resetbtn.hover')) {
                resetrepeat('reincarnationChallenge');
            }
        }
    }
    if (i >= 11 && ((!auto && player.toggles[31] === false) || player.challengecompletions[10] > 0) && player.achievements[141] === 1) {
        if ((!auto && player.toggles[31] === false) || (player.currentChallenge.transcension === 0 && player.currentChallenge.reincarnation === 0 && player.currentChallenge.ascension === 0)) {
            player.currentChallenge.ascension = i;
            reset('ascensionChallenge', false, 'enterChallenge');
        }
    }
    updateChallengeDisplay();
    getChallengeConditions(i);

    if (i <= 10 && !auto && player.autoChallengeRunning) {
        toggleAutoChallengeRun();
    }

    if (player.currentChallenge.transcension !== 0 && player.currentChallenge.reincarnation !== 0 && player.currentChallenge.ascension !== 0 && player.achievements[238] < 1) {
        achievementaward(238)
    }
}

type ToggleBuy = 'coin' | 'crystal' | 'mythos' | 'particle' | 'offering' | 'tesseract' | 'singularity' | 'octeract';

export const toggleBuyAmount = (quantity: number, type: ToggleBuy) => {
    player[`${type}buyamount` as const] = quantity;
    const buildingOrdsToNum = [1, 10, 100, 1000, 1000000];
    const buildingOrdsToStr = ['one', 'ten', 'hundred', 'thousand', 'million'];
    for (let index = 0; index < buildingOrdsToNum.length; index++) {
        if (quantity === buildingOrdsToNum[index]) {
            DOMCacheGetOrSet(`${type}${buildingOrdsToStr[index]}`).style.backgroundColor = 'Green';
        } else {
            DOMCacheGetOrSet(`${type}${buildingOrdsToStr[index]}`).style.backgroundColor = '';
        }
    }
}

type upgradeAutos = 'coin' | 'prestige' | 'transcend' | 'generators' | 'automations' | 'reincarnate'

/**
 * Updates Auto Upgrade Border Colors if applicable, or updates the status of an upgrade toggle as optional.
 * @param toggle Targets a specific upgrade toggle if provided
 */
export const toggleShops = (toggle?: upgradeAutos) => {
    // toggle provided: we do not want to update every button
    if (toggle) {
        player.shoptoggles[toggle] = !player.shoptoggles[toggle]
        DOMCacheGetOrSet(`${toggle}AutoUpgrade`).style.borderColor = player.shoptoggles[toggle] ? 'green' : 'red';
        DOMCacheGetOrSet(`${toggle}AutoUpgrade`).textContent = 'Auto: ' + (player.shoptoggles[toggle] ? 'ON': 'OFF');
    } else {
        const keys = Object.keys(player.shoptoggles) as (keyof Player['shoptoggles'])[]
        for (const key of keys) {
            const color = player.shoptoggles[key]? 'green': 'red'
            const auto = 'Auto: ' + (player.shoptoggles[key] ? 'ON' : 'OFF')
            DOMCacheGetOrSet(`${key}AutoUpgrade`).style.borderColor = color
            DOMCacheGetOrSet(`${key}AutoUpgrade`).textContent = auto
        }
    }
}

export function tabs(): Tab;
export function tabs(mainTab: number): TabValue;
export function tabs(mainTab?: number) {
    const tabs: Tab = {
        '-1': {tabName: 'settings', unlocked: true},
        0: {tabName: 'shop', unlocked: player.unlocks.reincarnate || player.highestSingularityCount > 0},
        1: {tabName: 'buildings', unlocked: true},
        2: {tabName: 'upgrades', unlocked: true},
        3: {tabName: 'achievements', unlocked: player.unlocks.coinfour},
        4: {tabName: 'runes', unlocked: player.unlocks.prestige},
        5: {tabName: 'challenges', unlocked: player.unlocks.transcend},
        6: {tabName: 'researches', unlocked: player.unlocks.reincarnate},
        7: {tabName: 'ants', unlocked: player.achievements[127] > 0},
        8: {tabName: 'cubes', unlocked: player.achievements[141] > 0},
        9: {tabName: 'traits', unlocked: player.challengecompletions[11] > 0},
        10: {tabName: 'singularity', unlocked: player.highestSingularityCount > 0}
    }

    if (typeof mainTab === 'undefined') {
        return tabs
    }

    return tabs[mainTab];
}

/**
 *
 * @param mainTab the index of the main tab
 * @returns Object()
 */
export const subTabsInMainTab = (mainTab: number) => {
    /**
     * An array of sub-tab objects with the IDs for the sub-tabs and buttons, and unlock conditions
     * @type {SubTab}
     */
    const subTabs: SubTab = {
        '-1': {
            tabSwitcher: setActiveSettingScreen,
            subTabList: [
                {subTabID: 'settingsubtab', unlocked: true},
                {subTabID: 'creditssubtab', unlocked: true},
                {subTabID: 'statisticsSubTab', unlocked: true},
                {subTabID: 'resetHistorySubTab', unlocked: player.unlocks.prestige},
                {subTabID: 'ascendHistorySubTab', unlocked: player.ascensionCount > 0},
                {subTabID: 'singularityHistorySubTab', unlocked: player.highestSingularityCount > 0},
                { subTabID: 'hotkeys', unlocked: true }
            ]
        },
        0: {subTabList: []},
        1: {
            tabSwitcher: toggleBuildingScreen,
            subTabList: [
                {subTabID: 'coin', unlocked: true, buttonID: 'switchToCoinBuilding'},
                {subTabID: 'diamond', unlocked: player.unlocks.prestige, buttonID: 'switchToDiamondBuilding'},
                {subTabID: 'mythos', unlocked: player.unlocks.transcend, buttonID: 'switchToMythosBuilding'},
                {subTabID: 'particle', unlocked: player.unlocks.reincarnate, buttonID: 'switchToParticleBuilding'},
                {subTabID: 'tesseract', unlocked: player.achievements[183] > 0, buttonID: 'switchToTesseractBuilding'}]
        },
        2: {subTabList: []},
        3: {subTabList: []},
        4: {
            tabSwitcher: toggleRuneScreen,
            subTabList: [
                {subTabID: 1, unlocked: player.unlocks.prestige, buttonID: 'toggleRuneSubTab1'},
                {subTabID: 2, unlocked: player.achievements[134] > 0, buttonID: 'toggleRuneSubTab2'},
                {subTabID: 3, unlocked: player.achievements[134] > 0, buttonID: 'toggleRuneSubTab3'},
                {subTabID: 4, unlocked: player.achievements[204] > 0, buttonID: 'toggleRuneSubTab4'}]
        },
        5: {subTabList: []},
        6: {subTabList: []},
        7: {subTabList: []},
        8: {
            tabSwitcher: toggleCubeSubTab,
            subTabList: [
                {subTabID: 1, unlocked: player.achievements[141] > 0, buttonID: 'switchCubeSubTab1'},
                {subTabID: 2, unlocked: player.achievements[197] > 0, buttonID: 'switchCubeSubTab2'},
                {subTabID: 3, unlocked: player.achievements[211] > 0, buttonID: 'switchCubeSubTab3'},
                {subTabID: 4, unlocked: player.achievements[218] > 0, buttonID: 'switchCubeSubTab4'},
                {subTabID: 5, unlocked: player.achievements[141] > 0, buttonID: 'switchCubeSubTab5'},
                {subTabID: 6, unlocked: player.achievements[218] > 0, buttonID: 'switchCubeSubTab6'},
                {subTabID: 7, unlocked: player.unlocks.hepteract, buttonID: 'switchCubeSubTab7'}]
        },
        9: {
            tabSwitcher: toggleCorruptionLoadoutsStats,
            subTabList: [
                {subTabID: true, unlocked: player.achievements[141] > 0, buttonID: 'corrStatsBtn'},
                {subTabID: false, unlocked: player.achievements[141] > 0, buttonID: 'corrLoadoutsBtn'}]
        },
        10: {
            tabSwitcher: toggleSingularityScreen,
            subTabList: [
                {subTabID: 1, unlocked: player.highestSingularityCount > 0, buttonID: 'toggleSingularitySubTab1'},
                {subTabID: 2, unlocked: player.highestSingularityCount > 0, buttonID: 'toggleSingularitySubTab2'},
                {subTabID: 3, unlocked: player.highestSingularityCount > 0, buttonID: 'toggleSingularitySubTab3'},
                {subTabID: 4, unlocked: Boolean(player.singularityUpgrades.octeractUnlock.getEffect().bonus), buttonID: 'toggleSingularitySubTab4'},
                {subTabID: 5, unlocked: Boolean(player.singularityUpgrades.ultimatePen.getEffect().bonus), buttonID: 'toggleSingularitySubTab5'}
            ]
        }
    }
    return subTabs[mainTab]!;
}

export const keyboardTabChange = (dir = 1, main = true) => {
    if (main) {
        player.tabnumber += dir
        const maxTab = Object.keys(tabs()).reduce((a, b) => Math.max(a, +b), -Infinity);
        const minTab = Object.keys(tabs()).reduce((a, b) => Math.min(a, +b), Infinity);
        // The loop point is chosen to be before settings so that new tabs can just be added to the end of the list
        // without needing to mess with the settings and shop
        const handleLoopBack = () => {
            if (player.tabnumber === maxTab + 1) { // went over from the right
                player.tabnumber = minTab // loop back left
            }
            if (player.tabnumber === minTab - 1) { // and vice versa
                player.tabnumber = maxTab
            }
        }
        handleLoopBack()
        while (!tabs(player.tabnumber).unlocked) {
            player.tabnumber += dir
            handleLoopBack()
        }
        toggleTabs(tabs(player.tabnumber).tabName)
    } else {
        const subTabList = subTabsInMainTab(player.tabnumber).subTabList
        if (subTabList.length === 0) {
            return
        }
        player.subtabNumber += dir
        const handleLoopBack = () => {
            const numSubTabs = subTabList.length
            player.subtabNumber = (player.subtabNumber + numSubTabs) % numSubTabs
        }
        handleLoopBack()
        while (!subTabList[player.subtabNumber].unlocked) {
            player.subtabNumber += dir
            handleLoopBack()
        }
        toggleSubTab(player.tabnumber, player.subtabNumber)
    }

    changeTabColor();
}

export const toggleSubTab = (mainTab = 1, subTab = 0) => {
    const subTabs = subTabsInMainTab(mainTab)
    if (tabs(mainTab).unlocked && subTabs.subTabList.length > 0) {

        const el = document.activeElement as HTMLElement | null;
        if (el !== null) {
            el.blur();
        }

        const subTabList = subTabs.subTabList[subTab];
        if (mainTab === -1) {
            // The first getElementById makes sure that it still works if other tabs start using the subtabSwitcher class
            const btn = DOMCacheGetOrSet('settings').getElementsByClassName('subtabSwitcher')[0].children[subTab]
            if (subTabList.unlocked) {
                player.subtabNumber = subTab
                subTabs.tabSwitcher?.(subTabList.subTabID, btn)
            }
        } else {
            if (subTabList.unlocked) {
                player.subtabNumber = subTab
                subTabs.tabSwitcher?.(subTabList.subTabID)
            }
        }
    }
}

export const toggleautoreset = (i: number, toggle = true) => {
    if (i === 1) {
        if (toggle) {
            player.resettoggle1 = player.resettoggle1 === 1 || player.resettoggle1 === 0 ? 2 : 1;
        }
        DOMCacheGetOrSet('prestigeautotoggle').textContent = player.resettoggle1 === 1
            ? 'Mode: AMOUNT'
            : 'Mode: TIME';
    } else if (i === 2) {
        if (toggle) {
            player.resettoggle2 = player.resettoggle2 === 1 || player.resettoggle2 === 0 ? 2 : 1;
        }
        DOMCacheGetOrSet('transcendautotoggle').textContent = player.resettoggle2 === 1
            ? 'Mode: AMOUNT'
            : 'Mode: TIME';
    } else if (i === 3) {
        if (toggle) {
            player.resettoggle3 = player.resettoggle3 === 1 || player.resettoggle3 === 0 ? 2 : 1;
        }
        DOMCacheGetOrSet('reincarnateautotoggle').textContent = player.resettoggle3 === 1
            ? 'Mode: AMOUNT'
            : 'Mode: TIME';
    } else if (i === 4) {
        if (toggle) {
            player.resettoggle4 = player.resettoggle4 === 1 || player.resettoggle4 === 0 ? 2 : 1;
        }
        DOMCacheGetOrSet('tesseractautobuymode').textContent = player.resettoggle4 === 1
            ? 'Mode: AMOUNT'
            : 'Mode: PERCENTAGE';
    }
}

export const toggleautobuytesseract = (toggle = true) => {
    if (toggle) {
        player.tesseractAutoBuyerToggle = player.tesseractAutoBuyerToggle === 1 || player.tesseractAutoBuyerToggle === 0 ? 2 : 1;
    }
    const el = DOMCacheGetOrSet('tesseractautobuytoggle');
    if (player.tesseractAutoBuyerToggle === 1) {
        el.textContent = 'Auto Buy: ON'
        el.style.border = '2px solid green'
    } else {
        el.textContent = 'Auto Buy: OFF'
        el.style.border = '2px solid red'
    }
}

export const toggleauto = () => {
    const toggles = Array.from<HTMLElement>(document.querySelectorAll('.auto[toggleid]'));
    for (const toggle of toggles) {
        const format = toggle.getAttribute('format') || 'Auto [$]';
        const toggleId = toggle.getAttribute('toggleId') || 1;

        const finishedString = format.replace('$', player.toggles[+toggleId] ? 'ON' : 'OFF')
        toggle.textContent = finishedString;
        if (!toggle.classList.contains('noColor')) {
            toggle.style.border = '2px solid ' + (player.toggles[+toggleId] ? 'green' : 'red');
        }
    }
}

export const toggleResearchBuy = (toggle = true) => {
    if (toggle) {
        player.researchBuyMaxToggle = !player.researchBuyMaxToggle;
    }
    const el = DOMCacheGetOrSet('toggleresearchbuy');
    el.textContent = player.researchBuyMaxToggle
        ? 'Upgrade: MAX [if possible]'
        : 'Upgrade: 1 Level';
}

export const toggleAutoResearch = (toggle = true) => {
    const el = DOMCacheGetOrSet('toggleautoresearch')
    if (toggle) {
        if (player.autoResearchToggle) {
            player.autoResearchToggle = false;
            el.textContent = 'Automatic: OFF';
            DOMCacheGetOrSet(`res${player.autoResearch || 1}`).classList.remove('researchRoomba');
            player.autoResearch = 0;
        } else {
            player.autoResearchToggle = true;
            el.textContent = 'Automatic: ON'
        }

        if (player.autoResearchToggle && autoResearchEnabled() && player.autoResearchMode === 'cheapest') {
            player.autoResearch = G['researchOrderByCost'][player.roombaResearchIndex]
        }
    } else {
        el.textContent = player.autoResearchToggle
            ? 'Automatic: ON'
            : 'Automatic: OFF';
    }
}

export const toggleAutoResearchMode = (toggle = true) => {
    const el = DOMCacheGetOrSet('toggleautoresearchmode')
    if (toggle) {
        if (player.autoResearchMode === 'cheapest') {
            player.autoResearchMode = 'manual';
            el.textContent = 'Automatic mode: Manual';
        } else {
            player.autoResearchMode = 'cheapest';
            el.textContent = 'Automatic mode: Cheapest';
        }
        DOMCacheGetOrSet(`res${player.autoResearch || 1}`).classList.remove('researchRoomba');

        if (player.autoResearchToggle && autoResearchEnabled() && player.autoResearchMode === 'cheapest') {
            player.autoResearch = G['researchOrderByCost'][player.roombaResearchIndex]
        }
    } else {
        el.textContent = player.autoResearchMode === 'cheapest'
            ? 'Automatic mode: Cheapest'
            : 'Automatic mode: Manual';
    }
}

export const toggleAutoSacrifice = (index: number, toggle = true) => {
    const el = DOMCacheGetOrSet('toggleautosacrifice')
    if (index === 0) {
        if (toggle) {
            if (player.autoSacrificeToggle) {
                player.autoSacrificeToggle = false;
                player.autoSacrifice = 0;
            } else {
                player.autoSacrificeToggle = true;
                player.saveOfferingToggle = false;
            }
        }
        if (player.autoSacrificeToggle) {
            const et = DOMCacheGetOrSet('saveOffToggle')
            el.textContent = 'Auto Runes: ON'
            el.style.border = '2px solid green'
            et.textContent = 'Save Offerings [OFF]'
            et.style.color = 'white'
        } else {
            el.textContent = 'Auto Runes: OFF'
            el.style.border = '2px solid red'
        }
    } else if (player.autoSacrificeToggle && player.shopUpgrades.offeringAuto > 0.5 && toggle) {
        if (player.autoSacrifice === index) {
            player.autoSacrifice = 0;
        } else {
            player.autoSacrifice = index;
        }
    }
    for (let i = 1; i <= 5; i++) {
        DOMCacheGetOrSet('rune' + i).style.backgroundColor = player.autoSacrifice === i ? 'orange' : '';
    }
    calculateRuneLevels();
}

export const toggleBuildingScreen = (input: BuildingSubtab) => {
    G['buildingSubTab'] = input
    const screen: Record<string, { screen: string, button: string, subtabNumber: number }> = {
        'coin': {
            screen: 'coinBuildings',
            button: 'switchToCoinBuilding',
            subtabNumber: 0
        },
        'diamond': {
            screen: 'prestige',
            button: 'switchToDiamondBuilding',
            subtabNumber: 1
        },
        'mythos': {
            screen: 'transcension',
            button: 'switchToMythosBuilding',
            subtabNumber: 2
        },
        'particle': {
            screen: 'reincarnation',
            button: 'switchToParticleBuilding',
            subtabNumber: 3
        },
        'tesseract': {
            screen: 'ascension',
            button: 'switchToTesseractBuilding',
            subtabNumber: 4
        }
    }
    for (const key in screen) {
        DOMCacheGetOrSet(screen[key].screen).style.display = 'none';
        DOMCacheGetOrSet(screen[key].button).style.backgroundColor = '';
    }
    DOMCacheGetOrSet(screen[G['buildingSubTab']].screen).style.display = 'flex'
    DOMCacheGetOrSet(screen[G['buildingSubTab']].button).style.backgroundColor = 'crimson'
    player.subtabNumber = screen[G['buildingSubTab']].subtabNumber
}

export const toggleRuneScreen = (index: number) => {
    const screens = ['runes', 'talismans', 'blessings', 'spirits'];
    G['runescreen'] = screens[index - 1];

    for (let i = 1; i <= 4; i++) {
        const a = DOMCacheGetOrSet('toggleRuneSubTab' + i);
        const b = DOMCacheGetOrSet('runeContainer' + i);
        if (i === index) {
            a.style.border = '2px solid gold'
            a.style.backgroundColor = 'crimson'
            b.style.display = 'flex';
        } else {
            a.style.border = '2px solid silver'
            a.style.backgroundColor = ''
            b.style.display = 'none';
        }
    }
    player.subtabNumber = index - 1
}

export const toggleautofortify = (toggle = true) => {
    if (toggle) {
        player.autoFortifyToggle = !player.autoFortifyToggle;
    }
    const el = DOMCacheGetOrSet('toggleautofortify');
    if (player.autoFortifyToggle) {
        el.textContent = 'Auto Fortify: ON'
        el.style.border = '2px solid green'
    } else {
        el.textContent = 'Auto Fortify: OFF'
        el.style.border = '2px solid red'
    }
}

export const toggleautoenhance = (toggle = true) => {
    if (toggle) {
        player.autoEnhanceToggle = !player.autoEnhanceToggle;
    }
    const el = DOMCacheGetOrSet('toggleautoenhance');
    if (player.autoEnhanceToggle) {
        el.textContent = 'Auto Enhance: ON'
        el.style.border = '2px solid green'
    } else {
        el.textContent = 'Auto Enhance: OFF'
        el.style.border = '2px solid red'
    }
}

export const toggleAutoBuyFragment = (toggle = true) => {
    if (toggle) {
        player.autoBuyFragment = !player.autoBuyFragment;
    }
    const el = DOMCacheGetOrSet('toggleautoBuyFragments');
    if (player.autoBuyFragment) {
        el.textContent = 'Auto Buy: ON'
        el.style.border = '2px solid white'
        el.style.color = 'orange'
    } else {
        el.textContent = 'Auto Buy: OFF'
        el.style.border = '2px solid orange'
        el.style.color = 'white'
    }
}

export const toggleSaveOff = (toggle = true) => {
    if (toggle) {
        player.autoSacrificeToggle = !player.saveOfferingToggle
        player.saveOfferingToggle = !player.saveOfferingToggle
    }
    const el = DOMCacheGetOrSet('saveOffToggle')
    const et = DOMCacheGetOrSet('toggleautosacrifice')
    if (player.saveOfferingToggle) {
        el.textContent = 'Save Offerings [ON]'
        el.style.color = 'yellow'
        et.textContent = 'Auto Runes: OFF'
        et.style.border = '2px solid red'
    } else {
        el.textContent = 'Save Offerings [OFF]'
        el.style.color = 'white'
        et.textContent = 'Auto Runes: ON'
        et.style.border = '2px solid green'
    }
}

export const toggleSingularityScreen = (index: number) => {
    const screens = ['shop', 'penalties', 'perks'];
    G['singularityscreen'] = screens[index - 1];

    for (let i = 1; i <= 5; i++) {
        const a = DOMCacheGetOrSet('toggleSingularitySubTab' + i);
        const b = DOMCacheGetOrSet('singularityContainer' + i);
        if (i === index) {
            a.style.backgroundColor = 'crimson'
            b.style.display = 'block';
        } else {
            a.style.backgroundColor = ''
            b.style.display = 'none';
        }
    }
    player.subtabNumber = index - 1

    if (player.subtabNumber === 3) {
        visualUpdateOcteracts();
    }
}

interface ChadContributor {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
    contributions: number
}

const setActiveSettingScreen = async (subtab: string, clickedButton: HTMLButtonElement) => {
    const subtabEl = DOMCacheGetOrSet(subtab);
    if (subtabEl.classList.contains('subtabActive')) {
        return;
    }

    const switcherEl = clickedButton.parentNode!;
    switcherEl.querySelectorAll('.buttonActive').forEach(b => b.classList.remove('buttonActive'));
    clickedButton.classList.add('buttonActive');

    subtabEl.parentNode!.querySelectorAll('.subtabActive').forEach(subtab => subtab.classList.remove('subtabActive'));
    subtabEl.classList.add('subtabActive');

    if (subtab === 'creditssubtab') {
        const credits = DOMCacheGetOrSet('creditList');
        const artists = DOMCacheGetOrSet('artistList');

        if (credits.childElementCount > 0 || artists.childElementCount > 0) {
            return;
        } else if (!navigator.onLine || document.hidden) {
            return;
        }

        try {
            const r = await fetch('https://api.github.com/repos/pseudo-corp/SynergismOfficial/contributors', {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            const j = await r.json() as ChadContributor[];

            for (const contributor of j) {
                const div = document.createElement('div');
                div.classList.add('credit');

                const img = new Image(32, 32);
                img.src = contributor.avatar_url;
                img.alt = contributor.login;

                const a = document.createElement('a');
                a.href = `https://github.com/Pseudo-Corp/SynergismOfficial/commits?author=${contributor.login}`;
                a.textContent = contributor.login;
                a.target = '_blank';
                a.rel = 'noopener noreferrer nofollow';

                div.appendChild(img);
                div.appendChild(a);

                credits.appendChild(div);
            }
        } catch (e) {
            const err = e as Error;
            credits.appendChild(document.createTextNode(err.toString()));
        }

        try {
            const r = await fetch('https://api.github.com/gists/01917ff476d25a141c5bad38340cd756', {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const j = await r.json() as { files: Record<string, { content: string }> };
            const f = JSON.parse(j.files['synergism_artists.json'].content) as string[];

            for (const user of f) {
                const p = document.createElement('p');
                p.textContent = user;

                artists.appendChild(p);
            }
        } catch (e) {
            const err = e as Error;
            credits.appendChild(document.createTextNode(err.toString()));
        }
    }
}

export const toggleShopConfirmation = (toggle = true) => {
    if (toggle) {
        player.shopConfirmationToggle = !player.shopConfirmationToggle;
    }
    const el = DOMCacheGetOrSet('toggleConfirmShop');
    el.textContent = player.shopConfirmationToggle
        ? 'Shop Confirmations: ON'
        : 'Shop Confirmations: OFF';
}

export const toggleBuyMaxShop = (toggle = true) => {
    if (toggle) {
        player.shopBuyMaxToggle = !player.shopBuyMaxToggle;
    }
    const el = DOMCacheGetOrSet('toggleBuyMaxShop');
    el.textContent = player.shopBuyMaxToggle
        ? 'Buy Max: ON'
        : 'Buy Max: OFF';
}

export const toggleHideShop = (toggle = true) => {
    if (toggle) {
        player.shopHideToggle = !player.shopHideToggle;
    }
    const el = DOMCacheGetOrSet('toggleHideShop');
    el.textContent = player.shopHideToggle
        ? 'Hide Maxed: ON'
        : 'Hide Maxed: OFF';
}

export const toggleAntMaxBuy = (toggle = true) => {
    if (toggle) {
        player.antMax = !player.antMax;
    }
    const el = DOMCacheGetOrSet('toggleAntMax');
    el.textContent = player.antMax
        ? 'Buy Max: ON'
        : 'Buy Max: OFF';
}

export const toggleAntAutoSacrifice = (mode = 0, toggle = true) => {
    if (mode === 0) {
        if (toggle) {
            player.autoAntSacrifice = !player.autoAntSacrifice;
        }
        const el = DOMCacheGetOrSet('toggleAutoSacrificeAnt');
        el.textContent = player.autoAntSacrifice
            ? 'Auto Sacrifice: ON'
            : 'Auto Sacrifice: OFF';
    } else if (mode === 1) {
        if (toggle) {
            player.autoAntSacrificeMode = player.autoAntSacrificeMode === 1 || player.autoAntSacrificeMode === 0 ? 2 : 1;
        }
        const el = DOMCacheGetOrSet('autoSacrificeAntMode');
        el.textContent = player.autoAntSacrificeMode === 2
            ? 'Mode: Real time'
            : 'Mode: In-game time';
    }
}

export const toggleMaxBuyCube = (toggle = true) => {
    if (toggle) {
        player.cubeUpgradesBuyMaxToggle = !player.cubeUpgradesBuyMaxToggle;
    }
    const el = DOMCacheGetOrSet('toggleCubeBuy');
    el.textContent = player.cubeUpgradesBuyMaxToggle
        ? 'Upgrade: MAX [if possible wow]'
        : 'Upgrade: 1 Level wow';
}

export const autoCubeUpgradesToggle = (toggle = true) => {
    if (toggle) {
        player.autoCubeUpgradesToggle = !player.autoCubeUpgradesToggle;
    }
    const el = DOMCacheGetOrSet('toggleAutoCubeUpgrades');
    if (player.autoCubeUpgradesToggle) {
        el.textContent = 'Auto Upgrades: [ON]'
        el.style.border = '2px solid green'
    } else {
        el.textContent = 'Auto Upgrades: [OFF]'
        el.style.border = '2px solid red'
    }
}

export const autoPlatonicUpgradesToggle = (toggle = true) => {
    if (toggle) {
        player.autoPlatonicUpgradesToggle = !player.autoPlatonicUpgradesToggle;
    }
    const el = DOMCacheGetOrSet('toggleAutoPlatonicUpgrades');
    if (player.autoPlatonicUpgradesToggle) {
        el.textContent = 'Auto Upgrades: [ON]'
        el.style.border = '2px solid green'
    } else {
        el.textContent = 'Auto Upgrades: [OFF]'
        el.style.border = '2px solid red'
    }
}

export const toggleCubeSubTab = (i: number) => {
    const numSubTabs = subTabsInMainTab(8).subTabList.length
    for (let j = 1; j <= numSubTabs; j++) {
        const cubeTab = DOMCacheGetOrSet(`cubeTab${j}`);
        if (cubeTab.style.display === 'flex' && j !== i) {
            cubeTab.style.display = 'none'
        }
        if (cubeTab.style.display === 'none' && j === i) {
            cubeTab.style.display = 'flex'
            player.subtabNumber = j - 1
        }
        DOMCacheGetOrSet('switchCubeSubTab' + j).style.backgroundColor = i === j ? 'crimson' : ''
    }

    visualUpdateCubes();
}

export const updateAutoChallenge = (i: number, change = true) => {
    switch (i) {
        case 1: {
            if (change) {
                const t = parseFloat((DOMCacheGetOrSet('startAutoChallengeTimerInput') as HTMLInputElement).value) || 0;
                player.autoChallengeTimer.start = Math.max(t, 0);
            }
            DOMCacheGetOrSet('startTimerValue').textContent = format(player.autoChallengeTimer.start, 2, true) + 's';
            return;
        }
        case 2: {
            if (change) {
                const u = parseFloat((DOMCacheGetOrSet('exitAutoChallengeTimerInput') as HTMLInputElement).value) || 0;
                player.autoChallengeTimer.exit = Math.max(u, 0);
            }
            DOMCacheGetOrSet('exitTimerValue').textContent = format(player.autoChallengeTimer.exit, 2, true) + 's';
            return;
        }
        case 3: {
            if (change) {
                const v = parseFloat((DOMCacheGetOrSet('enterAutoChallengeTimerInput') as HTMLInputElement).value) || 0;
                player.autoChallengeTimer.enter = Math.max(v, 0);
            }
            DOMCacheGetOrSet('enterTimerValue').textContent = format(player.autoChallengeTimer.enter, 2, true) + 's';
            return;
        }
    }
}

export const toggleAutoChallengesIgnore = (i: number, toggle = true) => {
    if (i <= 15) {
        if (toggle) {
            player.autoChallengeToggles[i] = !player.autoChallengeToggles[i];
        }
        const el = DOMCacheGetOrSet('toggleAutoChallengeIgnore');
        el.style.display = i <= (autoAscensionChallengeSweepUnlock() ? 15 : 10) && player.researches[150] > 0 ? 'block' : 'none';
        el.style.border = player.autoChallengeToggles[i] ? '2px solid green' : '2px solid red';
        el.textContent = `${i >= 11 && i <= 15 ? 'Auto Ascension' : 'Automatically'} Run Chal.${i} [${player.autoChallengeToggles[i] ? 'ON' : 'OFF'}]`;
    }
}

export const toggleAutoChallengeRun = (toggle = true) => {
    const el = DOMCacheGetOrSet('toggleAutoChallengeStart');
    if (toggle) {
        player.autoChallengeRunning = !player.autoChallengeRunning;
        if (player.autoChallengeRunning) {
            toggleAutoChallengeModeText('START');
            G['autoChallengeTimerIncrement'] = 0;
        } else {
            toggleAutoChallengeModeText('OFF');
            G['autoChallengeTimerIncrement'] = 0;
        }
    }
    if (player.autoChallengeRunning) {
        el.textContent = 'Auto Challenge Sweep [ON]'
        el.style.border = '2px solid gold'
    } else {
        el.textContent = 'Auto Challenge Sweep [OFF]'
        el.style.border = '2px solid red'
    }
}

export const toggleAutoChallengeModeText = (i: string) => {
    const el = DOMCacheGetOrSet('autoChallengeType');
    el.textContent = 'MODE: ' + i;
}

export const toggleAutoAscend = (mode = 0, toggle = true) => {
    if (mode === 0) {
        if (toggle) {
            player.autoAscend = !player.autoAscend;
        }
        const el = DOMCacheGetOrSet('ascensionAutoEnable');
        if (player.autoAscend) {
            el.textContent = 'Auto Ascend [ON]'
            el.style.border = '2px solid green'
        } else {
            el.textContent = 'Auto Ascend [OFF]'
            el.style.border = '2px solid red'
        }
    } else if (mode === 1) {
        if (toggle) {
            if (player.autoAscendMode === 'c10Completions' && player.highestSingularityCount >= 5) {
                player.autoAscendMode = 'realAscensionTime'
            } else {
                player.autoAscendMode = 'c10Completions'
            }
        }
        const el = DOMCacheGetOrSet('ascensionAutoToggle');
        el.textContent = player.autoAscendMode === 'realAscensionTime'
            ? 'Mode: Real time'
            : 'Mode: C10 Completions';
    }
}

export const toggleautoopensCubes = (i: number, toggle = player.highestSingularityCount >= 35) => {
    if (i === 1) {
        if (toggle) {
            player.autoOpenCubes = !player.autoOpenCubes;
        }
        const oc = DOMCacheGetOrSet('openCubes');
        const oci = DOMCacheGetOrSet('cubeOpensInput');
        if (player.autoOpenCubes) {
            oc.textContent = `Auto Open ${format(player.openCubes, 0)}%`;
            oc.style.border = '1px solid green';
            oci.style.border = '1px solid green';
        } else {
            oc.textContent = 'Auto Open [OFF]';
            oc.style.border = '1px solid red';
            oci.style.border = '1px solid red';
        }
    } else if (i === 2) {
        if (toggle) {
            player.autoOpenTesseracts = !player.autoOpenTesseracts;
        }
        const oc = DOMCacheGetOrSet('openTesseracts');
        const oci = DOMCacheGetOrSet('tesseractsOpensInput');
        if (player.autoOpenTesseracts) {
            oc.textContent = `Auto Open ${format(player.openTesseracts, 0)}%`;
            oc.style.border = '1px solid green';
            oci.style.border = '1px solid green';
        } else {
            oc.textContent = 'Auto Open [OFF]';
            oc.style.border = '1px solid red';
            oci.style.border = '1px solid red';
        }
    } else if (i === 3) {
        if (toggle) {
            player.autoOpenHypercubes = !player.autoOpenHypercubes;
        }
        const oc = DOMCacheGetOrSet('openHypercubes');
        const oci = DOMCacheGetOrSet('hypercubesOpensInput');
        if (player.autoOpenHypercubes) {
            oc.textContent = `Auto Open ${format(player.openHypercubes, 0)}%`;
            oc.style.border = '1px solid green';
            oci.style.border = '1px solid green';
        } else {
            oc.textContent = 'Auto Open [OFF]';
            oc.style.border = '1px solid red';
            oci.style.border = '1px solid red';
        }
    } else if (i === 4) {
        if (toggle) {
            player.autoOpenPlatonicsCubes = !player.autoOpenPlatonicsCubes;
        }
        const oc = DOMCacheGetOrSet('openPlatonicCube');
        const oci = DOMCacheGetOrSet('platonicCubeOpensInput');
        if (player.autoOpenPlatonicsCubes) {
            oc.textContent = `Auto Open ${format(player.openPlatonicsCubes, 0)}%`;
            oc.style.border = '1px solid green';
            oci.style.border = '1px solid green';
        } else {
            oc.textContent = 'Auto Open [OFF]';
            oc.style.border = '1px solid red';
            oci.style.border = '1px solid red';
        }
    }
}

export const updateRuneBlessingBuyAmount = (i: number, toggle = true) => {
    switch (i) {
        case 1: {
            if (toggle) {
                const t = Math.floor(parseFloat((DOMCacheGetOrSet('buyRuneBlessingInput') as HTMLInputElement).value)) || 1;
                player.runeBlessingBuyAmount = Math.max(t, 1);
            }
            DOMCacheGetOrSet('buyRuneBlessingToggleValue').textContent = format(player.runeBlessingBuyAmount);
            return;
        }
        case 2: {
            if (toggle) {
                const u = Math.floor(parseFloat((DOMCacheGetOrSet('buyRuneSpiritInput') as HTMLInputElement).value)) || 1;
                player.runeSpiritBuyAmount = Math.max(u, 1);
            }
            DOMCacheGetOrSet('buyRuneSpiritToggleValue').textContent = format(player.runeSpiritBuyAmount);
            return;
        }
    }
}

export const toggleAutoTesseracts = (i: number, toggle = true) => {
    if (toggle) {
        player.autoTesseracts[i] = !player.autoTesseracts[i];
    }
    const el = DOMCacheGetOrSet('tesseractAutoToggle' + i);
    if (player.autoTesseracts[i]) {
        el.textContent = 'Auto [ON]'
        el.style.border = '2px solid green';
    } else {
        el.textContent = 'Auto [OFF]'
        el.style.border = '2px solid red';
    }
}

export const toggleCorruptionLevel = (index: number, value: number) => {
    const current = player.prototypeCorruptions[index]
    const maxCorruption = maxCorruptionLevel();
    if (value > 0 && current < maxCorruption && 0 < index && index <= 9) {
        player.prototypeCorruptions[index] += Math.min(maxCorruption - current, value)
    }
    if (value < 0 && current > 0 && 0 < index && index <= 9) {
        player.prototypeCorruptions[index] -= Math.min(current, -value)
    }
    player.prototypeCorruptions[index] = Math.min(maxCorruption, Math.max(0, player.prototypeCorruptions[index]))
    if (value === 999 && player.currentChallenge.ascension !== 15) {
        for (let i = 0; i <= 9; i++) {
            player.usedCorruptions[i] = 0;
            player.prototypeCorruptions[i] = 0;
            if (i > 1) {
                corruptionDisplay(i)
            }
        }

        corruptionDisplay(G['corruptionTrigger'])
        DOMCacheGetOrSet('corruptionCleanseConfirm').style.visibility = 'hidden';

        if (player.currentChallenge.ascension === 15) {
            void resetCheck('ascensionChallenge', false, true)
        }
    }
    corruptionDisplay(index)
    corruptionLoadoutTableUpdate();
}

export const toggleCorruptionLoadoutsStats = (stats: boolean) => {
    player.corruptionShowStats = stats;
    showCorruptionStatsLoadouts();
}

export const toggleAscStatPerSecond = (id: number) => {
    const el = DOMCacheGetOrSet(`unit${id}`);
    el.textContent = player.ascStatToggles[id] ? '/s' : '';
    if (id === 6) {
        el.textContent = '';
    }
    player.ascStatToggles[id] = !player.ascStatToggles[id];
}

export const toggleHepteractAutoPercentage = async(): Promise<void> => {
    const amount = await Prompt(
        'Enter a number from 0 to 100 (integer only!) to set autocraft percentage. ' +
        'Every ascension, that percentage of your hepteracts are used to craft equally split ' +
        'between every hepteract with AUTO ON. Auto crafting also does not consume other resources! ' +
        '[Except Quarks, of course...]'
    );

    if (amount === null) {
        if (player.toggles[35]) {
            return Alert(`Your percentage is kept at ${player.hepteractAutoCraftPercentage}%.`);
        } else {
            return
        }
    }

    const isPercentage = amount.endsWith('%');
    const rawPercentage = isPercentage ? Number(amount.slice(0, -1)) : Number(amount);

    if (Number.isNaN(rawPercentage) || !Number.isFinite(rawPercentage) || !Number.isInteger(rawPercentage)) {
        return Alert('Value must be a finite, non-decimal number!');
    } else if (rawPercentage < 0 || rawPercentage > 100) {
        return Alert('Value must be a number between 0 and 100, inclusive!');
    } else if (rawPercentage === player.hepteractAutoCraftPercentage && player.toggles[35]) {
        return Alert(`Your percentage is kept at ${player.hepteractAutoCraftPercentage}%.`)
    }

    player.hepteractAutoCraftPercentage = rawPercentage
    DOMCacheGetOrSet('autoHepteractPercentage').textContent = `${player.hepteractAutoCraftPercentage}`
    if (player.toggles[35]) {
        return Alert(`Okay. On Ascension, ${player.hepteractAutoCraftPercentage}% of your Hepteracts will be used in crafting.`)
    }
}

export const confirmReply = (confirm = true) => {
    if (DOMCacheGetOrSet('alertWrapper').style.display === 'block') {
        (DOMCacheGetOrSet('ok_alert') as HTMLButtonElement).click();
    }
    if (DOMCacheGetOrSet('confirmWrapper').style.display === 'block' || DOMCacheGetOrSet('promptWrapper').style.display === 'block') {
        if (confirm) {
            (DOMCacheGetOrSet('ok_confirm') as HTMLButtonElement).click();
        } else {
            (DOMCacheGetOrSet('cancel_confirm') as HTMLButtonElement).click();
        }
    }
}

export const toggleUpdates = () => {
    toggleAutoTesseracts(1, false);
    toggleAutoTesseracts(2, false);
    toggleAutoTesseracts(3, false);
    toggleAutoTesseracts(4, false);
    toggleAutoTesseracts(5, false);
    toggleautoreset(1, false);
    toggleautoreset(2, false);
    toggleautoreset(3, false);
    toggleautoreset(4, false);
    toggleautobuytesseract(false);
    toggleautoopensCubes(1, false);
    toggleautoopensCubes(2, false);
    toggleautoopensCubes(3, false);
    toggleautoopensCubes(4, false);
    toggleAutoResearch(false);
    toggleAutoResearchMode(false);
    toggleAutoSacrifice(0, false);
    toggleAutoBuyFragment(false);
    toggleautofortify(false);
    toggleautoenhance(false);
    player.saveOfferingToggle = false; //Lint doesnt like it being inside if
    DOMCacheGetOrSet('saveOffToggle').textContent = 'Save Offerings [OFF]'
    DOMCacheGetOrSet('saveOffToggle').style.color = 'white'
    toggleAutoAscend(0, false);
    toggleAutoAscend(1, false);
    toggleShopConfirmation(false);
    toggleBuyMaxShop(false);
    toggleHideShop(false);
    toggleResearchBuy(false);
    toggleMaxBuyCube(false);
    autoCubeUpgradesToggle(false);
    autoPlatonicUpgradesToggle(false);
    toggleAntMaxBuy(false);
    toggleAntAutoSacrifice(0, false);
    toggleAntAutoSacrifice(1, false);
}
