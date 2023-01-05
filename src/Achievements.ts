import { format, player } from './Synergism';
import { Globals as G } from './Variables';
import { Alert, Notification, revealStuff } from './UpdateHTML';
import { Synergism } from './Events';
import { sumContents } from './Utility';
import Decimal from 'break_infinity.js';
import { CalcCorruptionStuff, calculateTimeAcceleration } from './Calculate';
import { DOMCacheGetOrSet } from './Cache/DOM';

export const maxAchievements = 301;

export const achievementpointvalues = [0,
    1, 2, 4, 6, 8, 9, 10,
    1, 2, 4, 6, 8, 9, 10,
    1, 2, 4, 6, 8, 9, 10,
    1, 2, 4, 6, 8, 9, 10,
    1, 2, 4, 6, 8, 9, 10,
    1, 2, 4, 6, 8, 9, 10,
    4, 5, 6, 7, 8, 9, 10,
    5, 6, 7, 8, 9, 10, 10,
    2, 8, 10, 2, 8, 10, 10,
    2, 8, 10, 10, 10, 10, 10,
    2, 4, 6, 8, 10, 10, 10,
    2, 4, 6, 7, 8, 9, 10,
    2, 4, 6, 7, 8, 9, 10,
    2, 4, 6, 7, 8, 9, 10,
    2, 4, 6, 7, 8, 9, 10,
    2, 4, 6, 7, 8, 9, 10,
    5, 7, 8, 9, 10, 10, 10,
    5, 7, 8, 9, 10, 10, 10,
    5, 7, 8, 9, 10, 10, 10,
    5, 7, 8, 9, 10, 10, 10,
    10, 10, 10, 10, 10, 10, 10,
    1, 2, 4, 6, 8, 9, 10,
    1, 2, 4, 6, 8, 9, 10,
    1, 2, 4, 6, 8, 9, 10,
    10, 10, 10, 10, 10, 10, 10,
    10, 10, 10, 10, 10, 10, 10,
    20, 20, 20, 40, 60, 60, 100,
    20, 20, 40, 40, 60, 60, 100,
    20, 20, 40, 40, 60, 60, 100,
    20, 40, 40, 40, 60, 60, 100,
    40, 40, 40, 60, 60, 100, 100,
    40, 40, 60, 60, 100, 100, 100,
    40, 40, 40, 60, 80, 100, 100,
    40, 60, 100, 60, 100, 100, 40,
    40, 40, 40, 40, 40, 40, 40,
    40, 40, 40, 40, 100, 100, 200,
    60, 80, 80, 80, 100, 100, 150,
    60, 80, 80, 80, 100, 100, 150,
    60, 80, 80, 80, 100, 100, 150,
    50, 60, 70, 80, 90, 100, 200,
    50, 50, 100, 100, 100, 100, 100,
    100, 100, 100, 100, 100, 100, 100,
    100, 100, 100, 100, 100, 100, 100
];

export let totalachievementpoints = 0;

const adesc = {
    1: 'A Loyal Employee: Hire your first Worker.',
    2: 'Small Business: Hire 10 Workers.',
    3: 'Now we\'re synergizing!: Hire 100 Workers.',
    4: 'Gaining Redundancies: Hire 1,000 Workers.',
    5: 'A cog in the machine: Hire 5,000 Workers.',
    6: 'A nail in the machine: Hire 10,000 Workers.',
    7: 'Are we even in the machine anymore?: Hire 20,000 Workers.',
    8: 'STONKS!!!: Purchase 1 Investment.',
    9: 'Planning ahead: Purchase 10 Investments.',
    10: 'Inside Trading: Purchase 100 Investments.',
    11: 'Outside Trading?: Purchase 1,000 Investments.',
    12: 'Market Takeover: Purchase 5,000 Investments.',
    13: 'Trickle-Down Economics: Purchase 10,000 Investments.',
    14: 'Eliminated Regulation: Purchase 20,000 Investments.',
    15: 'Stationery!: Build 1 Printer.',
    16: 'Printing Press: Build 10 Printers.',
    17: 'It prints free money!: Build 100 Printers.',
    18: 'Solving Our Debts: Build 1,000 Printers.',
    19: 'Monopolizing the market: Build 5,000 Printers.',
    20: 'We\'re running out of Ink!: Build 10,000 Printers.',
    21: '3D-printing the universe: Build 20,000 Printers.',
    22: 'A national treasure: Establish 1 Coin Mint.',
    23: 'Now with competition!: Establish 10 Coin Mints.',
    24: 'Counterfeiting with Style!: Establish 100 Coin Mints.',
    25: 'Why do we need all these?: Establish 1000 Coin Mints.',
    26: 'No really, why??: Establish 5,000 Coin Mints.',
    27: 'Is no one to stop us???: Establish 10,000 Coin Mints.',
    28: 'Oh well, time to mint: Establish 20,000 Coin Mints.',
    29: 'Newton\'s Apprentice: Create 1 Alchemy.',
    30: 'Lab Work: Create 10 Alchemies.',
    31: 'Satanic Becomings: Create 66 Alchemies.',
    32: 'Satan Incarnate: Create 666 Alchemies.',
    33: 'Is this more demonic?: Create 6,666 Alchemies.',
    34: 'Golden Paradise: Create 17,777 Alchemies.',
    35: 'Unlocking secrets to the world: Create 42,777 Alchemies.',
    36: 'Leveling up: Prestige for at least 1 Diamond.',
    37: 'High-Tiered: Prestige for at least 1e+6 Diamonds.',
    38: 'Highly Regarded: Prestige for at least 1e+100 Diamonds.',
    39: 'Prestigious: Prestige for at least 1e+1000 Diamonds.',
    40: 'Legendary: Prestige for at least 1e+10000 Diamonds.',
    41: 'Divine: Prestige for at least 1e+77777 Diamonds.',
    42: 'Perfectly Respected: Prestige for at least 1e+250000 Diamonds.',
    43: 'A Simple Detour: Transcend for at least 1 Mythos.',
    44: 'Tunnel Vision: Transcend for at least 1e+6 Mythos.',
    45: 'Risen from the Ashes: Transcend for at least 1e+50 Mythos.',
    46: 'Paradigm Shift: Transcend for at least 1e+308 Mythos.',
    47: 'Preparation: Transcend for at least 1e+2000 Mythos.',
    48: 'Revising the Plan: Transcend for at least 1e+25000 Mythos.',
    49: 'Leaving the Universe: Transcend for at least 1e+100000 Mythos.',
    50: 'Going Quantum: Reincarnate for at least 1 Particle.',
    51: 'Tunneling Vision: Reincarnate for at least 100,000 Particles.',
    52: 'Simulating the World: Reincarnate for at least 1e+30 Particles.',
    53: 'Multidimensional Creation: Reincarnate for at least 1e+200 Particles.',
    54: 'Lepton Dance: Reincarnate for at least 1e+1500 Particles.',
    55: 'Do we have enough yet?: Reincarnate for at least 1e+5000 Particles.',
    56: 'I Feel Luck in My Cells: Reincarnate for at least 1e+7777 Particles.',
    57: 'One Way Only: Prestige without buying Multipliers.',
    58: 'Authentic Shifting: Transcend without having bought a Multiplier.',
    59: 'The Singularity: Reincarnate without having bought a Multiplier.',
    60: 'Gotta go SLOW!: Prestige without buying Accelerators or Accelerator Boosts.',
    61: 'I\'m really going slow: Transcend without having bought Accelerators or Boosts.',
    62: 'Are we there yet?: Reincarnate without having bought Accelerators or Boosts.',
    63: 'A careful search for Diamonds: Get 1e120,000 Coins in [Reduced Diamonds] without buying Accelerators or Boosts.',
    64: 'Very Based: Prestige without purchasing Coin Upgrades.',
    65: 'Miser: Transcend without purchasing Coin Upgrades.',
    66: 'True Miser: Transcend without purchasing Coin or Diamond Upgrades.',
    67: 'Coinless Pursuit: Reincarnate without purchasing Coin Upgrades.',
    68: 'Diamonds don\'t matter to me!: Reincarnate without purchasing Coin or Diamond Upgrades.',
    69: 'Leave nothing behind: Reincarnate without purchasing Coin, Diamond or Mythos Upgrades.',
    70: 'Leave NOTHING behind.: Reincarnate without purchasing Coin, Diamond, Mythos, or Generator Upgrades.',
    71: 'Out of Order: Buy Generator Upgrade Row 1, #2 first in a Transcension (IV -> III)',
    72: 'More Out of Order: Buy Generator Upgrade Row 1, #3 first in a Transcension (III -> II)',
    73: 'Four\'s a Company: Buy Generator Upgrade Row 1, #4 first in a Transcension (II -> I)',
    74: 'Five\'s a Croud: Buy Generator Upgrade Row 1, #5 first in a Transcension (I -> V)',
    75: 'Vaseline without the Machine: Exit [No Multiplier] with at least 1e1000 coins and without any of the row 1 generator upgrades.',
    76: 'Rage against the Machine: Exit [No Accelerator] with at least 1e1000 coins and without any of the row 1 generator upgrades.',
    77: 'Amish Paradise: Exit [No Shards] with at least 1e99,999 coins and without any of the row 1 generator upgrades.',
    78: 'Single-Cell: Complete [No Multiplier] once.',
    79: 'Solidarity: Complete [No Multiplier] three times.',
    80: 'Duplication-Free!: Complete [No Multiplier] five times.',
    81: 'Multitasking Challenged: Complete [No Multiplier] ten times.',
    82: 'No Deaths: Complete [No Multiplier] twenty times.',
    83: 'Population One: Complete [No Multiplier] fifty times.',
    84: 'Insert Another Token: Complete [No Multiplier] seventy-five times.',
    85: 'Slow Start: Complete [No Accelerator] once',
    86: 'Respawn Rate -12%: Complete [No Accelerator] three times.',
    87: 'Putting the Breaks On: Complete [No Accelerator] five times.',
    88: 'Racing a Sloth...: Complete [No Accelerator] ten times.',
    89: '... and Losing.: Complete [No Accelerator] twenty times.',
    90: 'Planck Distance Traveled: Complete [No Accelerator] fifty times.',
    91: 'Inverse-Ackermann Growth: Complete [No Accelerator] seventy-five times.',
    92: 'Intact: Complete [No Shards] once.',
    93: 'Augments are Stupid!: Complete [No Shards] three times.',
    94: 'Grandmasters are Brilliant!: Complete [No Shards] five times.',
    95: 'Gotta get those Grandmasters Stronger: Complete [No Shards] ten times.',
    96: 'Summoning Enhancements: Complete [No Shards] twenty times.',
    97: 'Magic 99/99: Complete [No Shards] fifty times.',
    98: 'Perfect Foresight: Complete [No Shards] seventy-five times.',
    99: 'Inflation: Complete [Cost+] once.',
    100: 'Hyperinflation: Complete [Cost+] three times.',
    101: 'Market Bubble: Complete [Cost+] five times.',
    102: 'Bull Market: Complete [Cost+] ten times.',
    103: 'Wealth Inequality: Complete [Cost+] twenty times.',
    104: 'Severe Overpay: Complete [Cost+] fifty times.',
    105: 'Societal Collapse: Complete [Cost+] seventy-five times.',
    106: 'Excavation: Complete [Reduced Diamonds] once.',
    107: 'Digging Deep: Complete [Reduced Diamonds] three times.',
    108: 'Frack As Needed: Complete [Reduced Diamonds] five times.',
    109: 'Unobtainium Pickaxe: Complete [Reduced Diamonds] ten times.',
    110: 'Fortune III: Complete [Reduced Diamonds] twenty times.',
    111: 'Every kiss...: Complete [Reduced Diamonds] fifty times.',
    112: '...begins with K.: Complete [Reduced Diamonds] seventy-five times.',
    113: 'Tax evasion!: Complete {[Higher Tax]} once.',
    114: 'Keeping up with the Joneses: Complete {[Higher Tax]} twice.',
    115: 'Offshore deposits: Complete {[Higher Tax]} three times.',
    116: 'Bribing officials: Complete {[Higher Tax]} five times.',
    117: 'Becoming President: Complete {[Higher Tax]} ten times.',
    118: 'Charitable Donation: Complete {[Higher Tax]} fifteen times.',
    119: 'IRS Audit: Complete {[Higher Tax]} twenty-five times.',
    120: 'Is there anybody in there?: Complete {[No Accelerator/Multiplier]} once.',
    121: 'Human being: Complete {[No Accelerator/Multiplier]} twice.',
    122: 'Interdimensional: Complete {[No Accelerator/Multiplier]} three times.',
    123: 'A slow nickel: Complete {[No Accelerator/Multiplier]} five times.',
    124: 'Multipliers don\'t even work 0/5: Complete {[No Accelerator/Multiplier]} ten times.',
    125: 'Accelerators don\'t even work -5/5: Complete {[No Accelerator/Multiplier]} fifteen times.',
    126: 'ACCELERATOR BOOSTS DON\'T EVEN WORK -100/5: Complete {[No Accelerator/Multiplier]} twenty-five times.',
    127: 'I hate this challenge: Complete {[Cost++]} Once.',
    128: 'A costly mistake: Complete {[Cost++]} Twice.',
    129: 'Impetus: Complete {[Cost++]} Three Times.',
    130: 'Are you broke yet? Complete {[Cost++]} Five Times.',
    131: 'The world of Finance: Complete {[Cost++]} Ten Times.',
    132: 'Marginal Gains: Complete {[Cost++]} Twenty Times.',
    133: 'I buy these: Complete {[Cost++]} Twenty-Five Times.',
    134: 'Agnostic: Complete {[No Runes]} Once.',
    135: 'Ant-i Runes: Complete {[No Runes]} Twice.',
    136: 'Isn\'t it getting tiresome?: Complete {[No Runes]} Three Times.',
    137: 'Machine does not accept offerings: Complete {[No Runes]} Five Times.',
    138: 'Runes Suck 1/5: Complete {[No Runes]} Ten Times.',
    139: 'I didn\'t even notice Prism was gone: Complete {[No Runes]} Twenty Times.',
    140: 'Atheist: Complete {[No Runes]} Twenty-Five Times.',
    141: 'Sadism: Complete {[Sadistic I]} Once.',
    142: 'Masochism: Complete {[Sadistic I]} Twice.',
    143: 'Insanity: Complete {[Sadistic I]} Three Times.',
    144: 'How? Complete {[Sadistic I]} Five Times.',
    145: 'Why? Complete {[Sadistic I]} Ten Times.',
    146: 'Descend: Complete {[Sadistic I]} Twenty Times.',
    147: 'End of the Universe: Complete {[Sadistic I]} Twenty-Five Times.',
    148: 'Gas gas gas: Purchase 5 Accelerators.',
    149: '0 to 25: Purchase 25 Accelerators.',
    150: '0 to 100: Purchase 100 Accelerators',
    151: 'Highway to Hell: Purchase 666 Accelerators.',
    152: 'Perhaps you should brake: Purchase 2,000 Accelerators.',
    153: 'Exit the vehicle now!: Purchase 12,500 Accelerators.',
    154: 'Faster than light: Purchase 100,000 Accelerators.',
    155: 'I\'ve been duped!: Purchase 2 Multipliers.',
    156: 'Funhouse Mirrors: Purchase 20 Multipliers.',
    157: 'Friend of binary: Purchase 100 Multipliers.',
    158: 'Feeling the cost growth yet?: Purchase 500 Multipliers.',
    159: 'Perhaps you\'ll feel the cost now: Purchase 2,000 Multipliers.',
    160: 'Exponential Synergy: Purchase 12,500 Multipliers.',
    161: 'Cloned: Purchase 100,000 Multipliers.',
    162: 'Jerk > 0: Purchase 2 Accelerator Boosts.',
    163: 'Can\'t the speedometer move any faster?: Purchase 10 Accelerator Boosts.',
    164: '50 G rotations: Purchase 50 Accelerator Boosts.',
    165: 'Dematerialize: Purchase 200 Accelerator Boosts.',
    166: 'Breaking the laws of Physics: Purchase 1,000 Accelerator Boosts.',
    167: 'Decayed Realism: Purchase 5,000 Accelerator Boosts.',
    168: 'Kinda fast: Purchase 15,000 Accelerator Boosts.',
    169: 'The Galactic Feast: Obtain 3 Galactic Crumbs.',
    170: 'Only the finest: Obtain 100,000 Galactic Crumbs.',
    171: 'Six-Course Meal: Obtain 666,666,666 Galactic Crumbs.',
    172: 'Accumulation of Food: Obtain 1e20 Galactic Crumbs.',
    173: 'Cookie Clicking: Obtain 1e40 Galactic Crumbs.',
    174: 'Unlimited Bread Sticks!: Obtain 1e500 Galactic Crumbs.',
    175: 'Restaurant at the end of the Universe: Obtain 1e2500 Galactic Crumbs.',
    176: 'Ant-icipation!: Amass a 2x Ant Multiplier through sacrifice and own a Tier 2 Ant.',
    177: 'Ant-ecedent: Amass a 6x Ant Multiplier through sacrifice and own a Tier 3 Ant.',
    178: 'Ants are friends, not food!: Amass a 20x Ant Multiplier through sacrifice and own a Tier 4 Ant.',
    179: 'Ant Devil?: Amass a 100x Ant Multiplier through sacrifice and own a Tier 5 Ant.',
    180: 'The world\'s best chef: Amass a 500x Ant Multiplier through sacrifice and own a Tier 6 Ant.',
    181: '6 Michelin Stars: Amass a 6,666x Ant Multiplier through sacrifice and own a Tier 7 Ant.',
    182: 'Keys to the Restaurant at the end of the Universe: Amass a 77,777x Ant Multiplier through sacrifice and own a Tier 8 Ant.',
    183: 'Up: Ascend Once.',
    184: 'Double-Up: Ascend Twice.',
    185: 'Give me Ten!: Ascend Ten Times.',
    186: 'Give me a Hundred: Ascend 100 Times.',
    187: 'Give me a Thousand: Ascend 1,000 Times.',
    188: 'Give me some arbitrary number I: Ascend 14,142 Times.',
    189: 'Give me some arbitrary number II: Ascend 141,421 Times.',
    190: 'Now that\'s what I call getting some Pi!: Attain a constant of 3.14.',
    191: 'One in a million: Attain a constant of 1,000,000 [1e6].',
    192: 'A number: Attain a constant of 4.32e10.',
    193: 'The coolest of numbers: Attain a constant of 6.9e21.',
    194: 'Planck^(-1): Attain a constant of 1.509e33.',
    195: 'Epsilon > a lot: Attain a constant of 1e66.',
    196: 'NUM_MAX: Attain a constant of 1.8e308.',
    197: 'Casualties: Clear \'Reduced Ants\' challenge once.',
    198: 'Fatalities: Clear \'Reduced Ants\' challenge twice.',
    199: 'Destruction: Clear \'Reduced Ants\' challenge three times.',
    200: 'War, what is it good for?: Clear \'Reduced Ants\' challenge five times.',
    201: 'Absolutely everything.: Clear \'Reduced Ants\' challenge ten times.',
    202: 'Perfect Storm: Clear \'Reduced Ants\' challenge twenty times.',
    203: 'Immaculate Storm: Clear \'Reduced Ants\' challenge thirty times.',
    204: 'I didn\'t need those stupid reincarnations anyway!: Clear \'No Reincarnation\' challenge once.',
    205: '[x1,x2,0,x3]: Clear \'No Reincarnation\' challenge twice.',
    206: 'Nonmetaphysical: Clear \'No Reincarnation\' challenge three times.',
    207: 'Living alone: Clear \'No Reincarnation\' challenge five times.',
    208: 'DM me on discord if you read these names: Clear \'No Reincarnation\' challenge ten times.',
    209: 'Yeah: Clear \'No Reincarnation\' challenge twenty times.',
    210: 'Science! Clear \'No Reincarnation\' challenge thirty times.',
    211: 'The IRS strikes back: Clear \'Tax+++\' challenge once.',
    212: 'Fiscal Policy: Clear \'Tax+++\' challenge twice.',
    213: 'Economic Boom: Clear \'Tax+++\' challenge three times.',
    214: 'Ant-onomics: Clear \'Tax+++\' challenge five times.',
    215: '\'Wow Platonic Tax sucks 1/5\': Clear \'Tax+++\' challenge ten times.',
    216: 'Haha this is hard for some reason: Clear \'Tax+++\' challenge twenty times.',
    217: 'Taxes are hard: Clear \'Tax+++\' challenge thirty times.',
    218: 'Shiny Blue Rock: Clear \'No Research\' once.',
    219: 'It\'s like Avatar: Clear \'No Research\' twice.',
    220: 'It\'s like Unobtainium: Clear \'No Research\' three times.',
    221: 'It\'s like a thing: Clear \'No Research\' five times.',
    222: 'It\'s like: Clear \'No Research\' ten times.',
    223: 'It\'s: Clear \'No Research\' twenty times.',
    224: 'It: Clear \'No Research\' thirty times.',
    225: 'Pretty Corrupt: Clear an Ascension with above 100,000 score.',
    226: 'Bought out: Clear an Ascension with above 1 million score.',
    227: 'Utterly Corrupt: Clear an Ascension with above 10 million score.',
    228: 'Antitrust: Clear an Ascension with above 100 million score.',
    229: 'Ant-i-trust: Clear an Ascension with above 1 billion score.',
    230: 'This is pretty unfair: Clear an Ascension with above 5 billion score.',
    231: 'Antichrist: Clear an Ascension with above 25 billion score.',
    232: 'Highly Blessed: Level your Speed Rune Blessing to 100,000.',
    233: 'Divine Blessing: Level your Speed Rune Blessing to 100,000,000.',
    234: 'Blessing III: Level your Speed Rune Blessing to 100 billion.',
    235: 'Spirit I: Level your Speed Spirit to 1 Million.',
    236: 'Spirit II: Level your Speed Spirit to 1 Billion.',
    237: 'Spirit III: Level your Speed Spirit to 1 Trillion.',
    238: 'Three-folded: [Hint: you may want to look into the inception]',
    239: 'Seeing red: [Hint: you may need a lot of red items]',
    240: 'ASCENDED: [Hint: you may need a LOT of Ascensions OR an particularly amazing Ascension]',
    241: 'Aesop: [Hint: you gotta be pretty dang slow]',
    242: 'Aesop\'s Revenge: [Hint: you gotta be pretty dang fast]',
    243: 'Unsmith: [Hint: unsmith emoji :unsmith: can be a pretty good input]',
    244: 'Smith: [Hint: :antismith: looks promising as well]',
    245: 'BLESSED: [Hint: Your Speed Blessing best be unreasonably high!]',
    246: 'Why? [Hint: Sometimes even 1 in over a Trillion counts!]',
    247: 'Challenging! [Hint: Challenge 11 is calling your name, but with even less Ants]',
    248: 'Seeing Red but not Blue: [Hint: Can you get red stuff without getting blue stuff?]',
    249: 'Overtaxed: [Hint: It might pay not to read!]',
    250: 'The Thousand Suns: [Hint: You need to fully research into becoming GOD]',
    251: 'The Thousand Moons: [Hint: You may need to cube yourself up]',
    252: 'Ending?: [Hint: You look for Antiquities of Ant God]',
    253: 'Platonicism: Clear an Ascension with 1e12 score.',
    254: 'That\'s a handful!: Clear an Ascension with 1e14 score.',
    255: 'The game where everything is made up: Clear an Ascension with 1e17 score.',
    256: '... and the points don\'t matter: Clear an Ascension with 2e18 score.',
    257: 'Arguably moral: Clear an Ascension with 4e19 score.',
    258: 'Khafra\'s Personal Best: Clear an Ascension with 1e21 score.',
    259: '100 million million million!: Clear an Ascension with 1e23 score.',
    260: 'Highly Dimensional Being: Ascend a total of 1e7 times.',
    261: 'Ant God\'s upheaval: Ascend a total of 1e8 times.',
    262: 'Did you forget about Ant God?: Ascend a total of 1e9 times.',
    263: 'Ant God is unemployed thanks to you: Ascend a total of 1e10 times.',
    264: 'I hope you\'re happy with yourself: Ascend a total of 1e11 times.',
    265: 'Oh well: Ascend a total of 1e12 times.',
    266: 'Keep up the gradual numerical increase: Ascend a total of 1e13 times.',
    267: 'Eigenvalued: Achieve a constant of 1e1,000.',
    268: 'Achieve Mathematics: Achieve a constant of 1e5,000.',
    269: 'Ramsay (5,5): Achieve a constant of 1e15,000.',
    270: 'What comes after this?: Achieve a constant of 1e50,000.',
    271: 'LARGE BOY: Achieve a constant of 1e100,000.',
    272: 'LARGER BOY: Achieve a constant of 1e300,000.',
    273: 'LARGEST BOY: Achieve a constant of 1e1,000,000.',
    274: 'Wrath of the Ant God: Clear an \'Sadistic Challenge II\' with 1,000,000 score.',
    275: 'Soothe of the Ant God: Clear an \'Sadistic Challenge II\' with 1e9 score.',
    276: 'Aloof of the Ant God: Clear an \'Sadistic Challenge II\' with 1e12 score.',
    277: 'Suggest of the Ant God: Clear an \'Sadistic Challenge II\' with 1e15 score.',
    278: 'Favorable of the Ant God: Clear an \'Sadistic Challenge II\' with 1e18 score.',
    279: 'Happiness of the Ant God: Clear an \'Sadistic Challenge II\' with 1e21 score.',
    280: 'Friend of the Ant God: Clear an \'Sadistic Challenge II\' with 1e24 score.',
    281: 'Singular: Highest reached Singularity 1 times.',
    282: 'Power Creep: Highest reached Singularity 2 times.',
    283: 'Singularity: Highest reached Singularity 3 times.',
    284: 'SingularRity: Highest reached Singularity 4 times.',
    285: 'SiINguLaRrRity: Highest reached Singularity 5 times.',
    286: 'SiIINGuLArRrIiTyY: Highest reached Singularity 7 times.',
    287: 'Inception: Highest reached Singularity 10 times.',
    288: 'Climbing: Highest reached Singularity 15 times.',
    289: 'Ascending: Highest reached Singularity 25 times.',
    290: 'Violently: Highest reached Singularity 35 times.',
    291: 'Radical: Highest reached Singularity 50 times.',
    292: 'Ultrasound: Highest reached Singularity 65 times.',
    293: 'Tremendously: Highest reached Singularity 80 times.',
    294: 'Endlessly: Highest reached Singularity 100 times.',
    295: 'Ultraviolet : Highest reached Singularity 125 times.',
    296: 'Extreme: Highest reached Singularity 150 times.',
    297: 'Neutron: Highest reached Singularity 175 times.',
    298: 'Unreal: Highest reached Singularity 200 times.',
    299: 'Multidimensional: Highest reached Singularity 225 times.',
    300: 'Exceedingly: Highest reached Singularity 250 times.',
    301: 'Singularitist: Highest reached Singularity 300 times.'

}

export const areward = (i: number): string => {
    // May 22, 2021: Allow achievement bonus values display directly in the description
    // Using areward as const object did not allow ${player object}

    //Effective score is 3rd index
    const corr = CalcCorruptionStuff();

    const descs: {[key: number]: string} = {
        3: 'Gain +.05% to Accelerator Power.',
        4: 'Start Transcensions/Challenges with Worker Autobuyer unlocked.',
        5: 'Gain +1 Accelerator per 500 Workers owned.',
        6: 'Gain +1 Multiplier per 1,000 Workers owned.',
        7: 'Gain +1 Accelerator Boost per 2,000 workers owned.',
        10: 'Gain +.10% to Accelerator Power.',
        11: 'Start Transcensions/Challenges with Investment Autobuyer unlocked.',
        12: 'Gain +1 Accelerator per 500 Investments owned.',
        13: 'Gain +1 Multiplier per 1,000 Investments owned.',
        14: 'Gain +1 Accelerator Boost per 2,000 Investments owned.',
        17: 'Gain +.15% to Accelerator Power.',
        18: 'Start Transcensions/Challenges with Printer Autobuyer unlocked.',
        19: 'Gain +1 Accelerator per 500 Printers owned.',
        20: 'Gain +1 Multiplier per 1,000 Printers owned.',
        21: 'Gain +1 Accelerator Boost per 2,000 Printers owned.',
        24: 'Gain +.20% to Accelerator Power.',
        25: 'Start Transcensions/Challenges with Coin Mint Autobuyer unlocked.',
        26: 'Gain +1 Accelerator per 500 Mints owned.',
        27: 'Gain +1 Multiplier per 1,000 Mints owned.',
        28: 'Gain +1 Accelerator Boost per 2,000 Mints owned.',
        31: 'Gain +.25% to Accelerator Power.',
        32: 'Start Transcensions/Challenges with Alchemy Autobuyer unlocked.',
        33: 'Gain 10% more Offerings from resets || +1 Accelerator per 500 Alchemies!',
        34: 'Gain 15% more Offerings from resets (stacks multiplicatively!) || +1 Multiplier per 1,000 Alchemies!',
        35: 'Gain 25% more Offerings from resets (stacks multiplicatively!) || +1 Accelerator Boost per 2,000 Alchemies!',
        36: 'Multiply Crystal Production by 2x.',
        37: 'Multiply Crystal Production by the common logarithm of owned Diamonds. Prestiges give more Offerings based on time spent (Up to +15 at 1800 seconds)',
        38: 'Unlock the Duplication rune!',
        43: 'Accelerator Boosts can be purchased from any screen. Unlock the Auto-Prestige feature.',
        44: 'Unlock the Prism Rune! Transcensions give more Offerings based on time spent (Up to +15 at 1800 seconds)',
        45: 'Reduce tax scaling by up to 5%, depending on the length of Prestige.',
        46: 'Reduce tax scaling by up to another 5%, depending on length of Prestige.',
        47: 'Reduce tax scaling by up to ANOTHER 10%, depending on length of Prestige!',
        50: 'Unlock new Atomic production and unlock 3 new incredibly difficult Challenges! Gain 2x particles on all future Reincarnations!',
        51: 'Manual Reincarnations give +4 Obtainium (unaffected by multipliers except time multiplier)!',
        52: 'Reincarnations give more Offerings based on time spent (Up to +25 at 1800 seconds)',
        53: 'Increase the amount of Obtainium gained through all features by 0.125% additive for each rune level.',
        57: 'Gain +1, +1% free Multipliers!',
        58: 'Gain +1, +1% more free Multipliers!',
        59: 'Gain +1, +1% more, MORE free Multipliers!',
        60: 'Gain +2, +1% free Accelerators!',
        61: 'Gain +2, +1% more free Accelerators!',
        62: 'Gain +2, +1% more, MORE free Accelerators!',
        71: '+1% Conversion Exponent on all generator upgrades!',
        72: '+1% Conversion Exponent on all generator upgrades!',
        73: '+1% Conversion Exponent on all generator upgrades!',
        74: '+1% Conversion Exponent on all generator upgrades!',
        75: '+1% Conversion Exponent on all generator upgrades!',
        76: '+1% Conversion Exponent on all generator upgrades!',
        77: '+1% Conversion Exponent on all generator upgrades! They\'re in overdrive now!',
        78: 'Start Transcensions/Challenges with 1 Refinery and automatically buy Refineries.',
        79: 'Automatically buy the first Crystal upgrade if you can afford it!',
        80: 'Start Transcensions/Challenges with Multiplier Autobuyer unlocked. +5% Offering recycle.',
        82: 'Delay tax growth by 4%.',
        84: '+1% Obtainium (stacks additively with other achievement rewards)',
        85: 'Start Transcensions/Challenges with 1 Coal Plant and automatically buy Coal Plants.',
        86: 'Automatically buy the second Crystal upgrade if you can afford it!',
        87: 'Start Transcensions/Challenges with Accelerator Autobuyer unlocked. +5% Offering recycle.',
        89: 'Delay tax growth by 4%.',
        91: '+3% Obtainium (stacks additively with other Achievement rewards)',
        92: 'Start Transcensions/Challenges with 1 Coal Rig and automatically buy Coal Rigs.',
        93: 'Automatically buy the third Crystal upgrade if you can afford it!',
        94: '+5% Offering recycle.',
        96: 'Delay tax growth by 4%.',
        98: '+5% Obtainium (stacks additively with other achievement rewards)',
        99: 'Start Transcensions/Challenges with 1 Diamond Pickaxe and automatically buy Diamond Pickaxes.',
        100: 'Automatically buy the fourth Crystal upgrade if you can afford it!',
        101: '+5% Offering recycle.',
        102: 'Unlock the Thrift rune!',
        103: 'Delay tax growth by 4%.',
        105: '+7% Obtainium (stacks additively with other achievement rewards)',
        106: 'Start Transcensions/Challenges with 1 Pandora\'s Box and automatically buy Pandora\'s Boxes.',
        107: 'Automatically buy the fifth Crystal upgrade if you can afford it!',
        108: '+5% Offering recycle.',
        110: 'Delay tax growth by 4%.',
        112: '+9% Obtainium (stacks additively with other achievement rewards)',
        115: '+5% Offering recycle.',
        117: 'Delay tax growth by 5.66%.',
        118: `Each Reincarnation Challenge completion delays tax growth by 0.75% per level, multiplicative. Effect: ${format(Math.pow(0.9925, player.challengecompletions[6] + player.challengecompletions[7] + player.challengecompletions[8] + player.challengecompletions[9] + player.challengecompletions[10]), 4)}x`,
        119: '+11% Obtainium. Unlock a nice trinket somewhere...',
        122: '+7.5% Offering recycle.',
        124: 'Delay tax growth by 5.66%. Unlock 5 new incredibly powerful researches!',
        126: '+13% Obtainium. You get an accessory to commemorate this moment!',
        127: 'Unlock 20 new incredibly expensive yet good researches. Unlock the [Anthill] feature!',
        128: 'Make researches go Cost-- with 1.5x Obtainium!',
        129: '+7.5% Offering recycle. Gain another 1.25x Obtainium multiplier!',
        131: 'Delay tax growth by 5.66%.',
        132: 'Permanently gain +25% more sacrifice reward!',
        133: '+15% Obtainium. Obtain the gift of Midas himself.',
        134: 'Unlock 10 newer incredibly expensive yet good researches. Unlock <<Talismans>> in the Runes Tab!',
        135: 'Talisman positive bonuses are now +0.02 stronger per level.',
        136: 'Talisman positive bonuses are now +0.02 even stronger per level.',
        137: 'Permanently gain +25% more sacrifice reward!',
        140: '+17% Obtainium. Lazy joke about not leaking talismans here [You get a new one]',
        141: 'Unlock a new reset tier!',
        147: '+19% Obtainium (Achievement total is up to 100%!). Gain the Polymath Talisman!',
        169: `ALL Ant speed multiplied by ${format(Decimal.log(player.antPoints.add(10), 10), 2)}`,
        171: '+16.666% ALL Ant speed!',
        172: 'Gain more Ants the longer your Reincarnation lasts (Max speed achieved in 2 hours)',
        173: 'Unlock Ant Sacrifice, allowing you to reset your Ants and Ant upgrades in exchange for amazing rewards! Automatically buy Worker Ants.',
        174: `Ant Multiplier from sacrifice is multiplied by another logarithm: x${format(0.4 * Decimal.log(player.antPoints.add(1), 10), 2)}`,
        176: 'Unlock Tier 2 Ant autobuy, and autobuy Inceptus and Fortunae Ants! Add +25 Base Ant ELO.',
        177: 'Unlock Tier 3 Ant autobuy, and autobuy Tributum Ants! Add +50 Base Ant ELO.',
        178: 'Unlock Tier 4 Ant autobuy, and autobuy Celeritas and Multa Ants! Add +75 Base Ant ELO.',
        179: 'Unlock Tier 5 Ant autobuy, and autobuy Sacrificium Ants! Add +100 Base Ant ELO.',
        180: 'Unlock Tier 6 Ant autobuy, and autobuy Hic and Experientia Ants! Add +1% Base Ant ELO.',
        181: 'Unlock Tier 7 Ant autobuy, and autobuy Praemoenio Ants! Add +2% Base Ant ELO.',
        182: 'Unlock Tier 8 Ant autobuy, and autobuy Scientia and Phylacterium Ants! Add +3% Base Ant ELO.',
        187: `Gain an Ascension Cubes multiplier based on your score: x${format(Math.max(1, Math.log10(corr[3]+1) - 7), 2)}. Also: Offerings +${format(Math.min(100, player.ascensionCount / 10000), 2)}% [Max: 100% at 1M Ascensions]`,
        188: `Gain +100 Ascension count for all Ascensions longer than 10 seconds. Also: Obtainium +${format(Math.min(100, player.ascensionCount / 50000), 2)}% [Max: 100% at 5M Ascensions]`,
        189: `Gain 20% of Excess time after 10 seconds each Ascension as a linear multiplier to Ascension count. Also: Cubes +${format(Math.min(200, player.ascensionCount / 2.5e6), 2)}% [Max: 200% at 500M Ascensions]`,
        193: `Gain ${format(Decimal.log(player.ascendShards.add(1), 10) / 4, 2)}% more Cubes on Ascension!`,
        195: `Gain ${format(Math.min(25000, Decimal.log(player.ascendShards.add(1), 10) / 4), 2)}% more Cubes and Tesseracts on Ascension! Multiplicative with the other Ach. bonus [MAX: 25,000% at e100,000 Const]`,
        196: `Gain ${format(Math.min(2000, Decimal.log(player.ascendShards.add(1), 10) / 50), 2)}% more Platonic Cubes on Ascension! [MAX: 2,000% at e100,000 Const]`,
        197: 'You will unlock a stat tracker for Ascensions.',
        198: 'Gain +4% Cubes on Ascension!',
        199: 'Gain +4% Cubes on Ascension!',
        200: 'Gain +4% Cubs on Ascension! Did I spell that wrong? You bet I did.',
        201: 'Gain +3% Cubes on Ascension!',
        202: `Gain 20% of Excess time after 10 seconds each Ascensions as a linear multiplier to Ascension count. Also: Tesseracts +${format(Math.min(200, player.ascensionCount / 5e6), 2)}% [Max: 200% at 1B Ascensions]`,
        204: 'You will gain 25% of Excess time after 10 seconds each Ascension as a linear multiplier to rewards.',
        205: 'Gain +4% Tesseracts on Ascension!',
        206: 'Gain +4% Tesseracts on Ascension!',
        207: 'Gain +4% Tesseracts on Ascension!',
        208: 'Gain +3% Tesseracts on Ascension!',
        209: 'Gain 20% of Excess time after 10 seconds each Ascensions as a linear multiplier to Ascension count.',
        211: 'You will gain 25% MORE Excess time (Total: 50%) after 10 seconds each Ascension as a linear multiplier to rewards.',
        212: 'Gain +4% Hypercubes on Ascension!',
        213: 'Gain +4% Hypercubes on Ascension!',
        214: 'Gain +4% Hypercubes on Ascension!',
        215: 'Gain +3% Hypercubes on Ascension!',
        216: `Gain 20% of Excess time after 10 seconds each Ascensions as a linear multiplier to Ascension count. Also: Hypercubes +${format(Math.min(200, player.ascensionCount / 1e7), 2)}% [Max: 200% at 2B Ascensions]`,
        218: 'You gain gain 50% MORE MORE excess time (Total: 100%) after 10 seconds each Ascension as a linear multiplier to rewards.',
        219: 'Gain +4% Platonic Cubes on Ascension!',
        220: 'Gain +4% Platonic Cubes on Ascension!',
        221: 'Gain +4% Platonic Cubes on Ascension!',
        222: 'Gain +3% Platonic Cubes on Ascension!',
        223: `Gain 20% of Excess time after 10 seconds each Ascensions as a linear multiplier to Ascension count. Also: Platonic Cubes +${format(Math.min(200, player.ascensionCount / 13370000), 2)}% [Max: 200% at 2.674B Ascensions]`,
        240: `Ascension Cube Gain Multipliers is VERY slightly affected by global speed multipliers: ${format(Math.min(1.5, 1 + Math.max(2, Math.log10(calculateTimeAcceleration()))/20), 2)}x (Min: 1.10x, Max: 1.50x)`,
        250: 'You gain a permanent +60% Obtainium and Offering bonus, with +6% all Cube types!',
        251: 'You gain a permanent +100% Obtainium and Offering bonus, with +10% all Cube types!',
        253: 'You will gain +10% Hypercubes! Why? I don\'t know.',
        254: `Cube Gain +${format(Math.min(15, Math.log10(corr[3]+1) * 0.6), 2, true)}% [Max: +15% at 1e25 Ascension Score]`,
        255: `Tesseract Gain +${format(Math.min(15, Math.log10(corr[3]+1) * 0.6), 2, true)}% [Max: +15% at 1e25 Ascension Score], and allow gain of Hepteracts.`,
        256: `Hypercube Gain +${format(Math.min(15, Math.log10(corr[3]+1) * 0.6), 2, true)}% [Max: +15% at 1e25 Ascension Score]. Also, Overflux Powder conversion rate is 5% better!`,
        257: `Platonic Gain +${format(Math.min(15, Math.log10(corr[3]+1) * 0.6), 2, true)}% [Max: +15% at 1e25 Ascension Score]. Also, Overflux Powder conversion rate is 5% better!`,
        258: `Hepteract Gain +${format(Math.min(15, Math.log10(corr[3]+1) * 0.6), 2, true)}% [Max: +15% at 1e25 Ascension Score]`,
        259: 'Corruption score is increased by 1% for every expansion of Abyss Hepteract!',
        260: 'You will gain 10% more Ascension count, forever!',
        261: 'You will gain 10% more Ascension count, forever!',
        262: `Ascensions are ${format(Math.min(10, Math.log10(player.ascensionCount+1)), 2)}% faster! Max: +10%`,
        263: `Ascensions are ${format(Math.min(10, Math.log10(player.ascensionCount+1)), 2)}% faster! Max: +10%`,
        264: `Hepteracts +${format(0.4 * Math.min(1, player.ascensionCount / 1e13) * 100, 2)}% [Max: 40% at 1e13 Ascensions]!`,
        265: `Hepteracts +${format(0.2 * Math.min(1, player.ascensionCount / 1e14) * 100, 2)}% [Max: 20% at 1e14 Ascensions]!`,
        266: `Quarks +${format(0.1 * Math.min(1, player.ascensionCount / 1e15) * 100, 2)}% [Max: 10% at 1e15 Ascensions]!`,
        267: `Ascension Score is boosted by ${format(Math.min(100, Decimal.log(player.ascendShards.add(1), 10) / 1000), 2)}% [Max: 100% at 1e100,000 Const]`,
        270: `Hepteract Gain is boosted by ${format(Math.min(100, Decimal.log(player.ascendShards.add(1), 10) / 10000), 2)}% [Max: 100% at 1e1,000,000 const], Constant Upgrade 1 boosted to 1.06 (from 1.05), Constant Upgrade 2 boosted to 1.11 (from 1.10).`,
        271: `When you open a Platonic Cube, gain ${format(Math.max(0, Math.min(1, (Decimal.log(player.ascendShards.add(1), 10) - 1e5) / 9e5)), 2, true)} Hypercubes, rounded down [Max: 1 at 1e1,000,000 Const]`,
        277: 'Unlock Hepteracts!',
        281: 'Ant Speed is permanently multiplied by 4.44! Platonic Upgrades now BuyMax whenever affordable!',
        282: 'You immediately start Singularities with 1 Transcension and 1001 mythos!',
        283: 'You immediately start Singularities with 1 Reincarnation, and 10 particles!',
        284: 'You immediately start Singularities with 500 Obtainium!',
        285: 'Gain 5% more Quarks, permanently! Automation regarding Particle Buildings are immediately available.',
        286: 'You immediately start Singularities with a Challenge 7 completion and 1e100 particles. Talismans now buff all runes at all times!',
        287: 'You immediately start Singularities with 1 Challenge 8 completion and 1 tier 1 Ant.',
        288: 'There is a perk of Blessings and Spirits automation',
        289: 'Unlock EXALT!',
        290: 'There a perk that can automatically open cubes in ascension',
        294: 'There are many perks when you reach here!',
        298: 'Once you reach here, you will again have tons of perks and quark gains!',
        301: 'What is hidden here?'
    }

    if (i in descs) {
        return descs[i]
    } else {
        return ''
    }
}

const acalcs: {[key: number]: ((...args: number[]) => number)} = {
    266: (a) => a * (0.1 * Math.min(1, player.ascensionCount / 1e15))
}

export const achievementBonus = (num: number): number => {
    if (num in acalcs) {
        return acalcs[num](player.achievements[num], num);
    } else {
        return 0;
    }
}

export const achievementAlerts = async (num: number) => {
    let text = ''
    switch (num){
        case 36:
            text = 'Congratulations on your first Prestige. The first of many. You obtain Offerings. You can use them in the new Runes tab! [Unlocked Runes, Achievements, Diamond Buildings and some Upgrades!]'
            break;
        case 38:
            text = 'Hmm, it seems you are getting richer, being able to get 1 Googol diamonds in a single Prestige. How about we give you another Rune? [Unlocked Duplication Rune in Runes tab!]'
            break;
        case 255:
            text = 'Wow! You gained 1e17 (100 Quadrillion) score in a single Ascension. For that, you can now generate Hepteracts if you get above 1.66e17 (166.6 Quadrillion) score in an Ascension. Good luck!'
    }

    if (text !== '' && player.highestSingularityCount === 0) {
        return Alert(text)
    }
}
//${format(Decimal.log(player.ascendShards.add(1), 10) / 1000, 2)} (log(constant)/1000)%!

// TODO: clean this up
export const resetachievementcheck = (i: number) => {
    if (i === 1) {
        if (player.prestigenoaccelerator === true && player.achievements[60] < 0.5) {
            achievementaward(60)
        }
        if (player.prestigenomultiplier === true && player.achievements[57] < 0.5) {
            achievementaward(57)
        }
        if (player.prestigenocoinupgrades === true && player.achievements[64] < 0.5) {
            achievementaward(64)
        }
        const requestDiamonds = ['1', '1e6', '1e100', '1e1000', '1e10000', '1e77777', '1e250000']
        for (let i = 0; i < requestDiamonds.length; i++) {
            if (player.achievements[36 + i] < 0.5 && G['prestigePointGain'].gte(requestDiamonds[i])) {
                achievementaward(36 + i)
            }
        }
    }
    if (i === 2) {
        if (player.transcendnoaccelerator === true && player.achievements[61] < 0.5) {
            achievementaward(61)
        }
        if (player.transcendnomultiplier === true && player.achievements[58] < 0.5) {
            achievementaward(58)
        }
        if (player.transcendnocoinupgrades === true && player.achievements[65] < 0.5) {
            achievementaward(65)
        }
        if (player.transcendnocoinorprestigeupgrades === true && player.achievements[66] < 0.5) {
            achievementaward(66)
        }
        const requestMythos = ['1', '1e6', '1e50', '1e308', '1e1500', '1e25000', '1e100000']
        for (let i = 0; i < requestMythos.length; i++) {
            if (player.achievements[43 + i] < 0.5 && G['transcendPointGain'].gte(requestMythos[i])) {
                achievementaward(43 + i)
            }
        }
    }
    if (i === 3) {
        if (player.reincarnatenoaccelerator === true && player.achievements[62] < 0.5) {
            achievementaward(62)
        }
        if (player.reincarnatenomultiplier === true && player.achievements[59] < 0.5) {
            achievementaward(59)
        }
        if (player.reincarnatenocoinupgrades === true && player.achievements[67] < 0.5) {
            achievementaward(67)
        }
        if (player.reincarnatenocoinorprestigeupgrades === true && player.achievements[68] < 0.5) {
            achievementaward(68)
        }
        if (player.reincarnatenocoinprestigeortranscendupgrades === true && player.achievements[69] < 0.5) {
            achievementaward(69)
        }
        if (player.reincarnatenocoinprestigetranscendorgeneratorupgrades === true && player.achievements[70] < 0.5) {
            achievementaward(70)
        }
        const requestParticles = ['1', '1e5', '1e30', '1e200', '1e1500', '1e5000', '1e7777']
        for (let i = 0; i < requestParticles.length; i++) {
            if (player.achievements[50 + i] < 0.5 && G['reincarnationPointGain'].gte(requestParticles[i])) {
                achievementaward(50 + i)
            }
        }
    }
}

/**
 * Array of [index, bar to get achievement if greater than, achievement number]
 */
const challengeCompletionsBar: [number, number, number][] = [
    [1, 0.5, 78], [1, 2.5, 79], [1, 4.5, 80], [1, 9.5, 81], [1, 19.5, 82], [1, 49.5, 83], [1, 74.5, 84],
    [2, 0.5, 85], [2, 2.5, 86], [2, 4.5, 87], [2, 9.5, 88], [2, 19.5, 89], [2, 49.5, 90], [2, 74.5, 91],
    [3, 0.5, 92], [3, 2.5, 93], [3, 4.5, 94], [3, 9.5, 95], [3, 19.5, 96], [3, 49.5, 97], [3, 74.5, 98],
    [4, 0.5, 99], [4, 2.5, 100], [4, 4.5, 101], [4, 9.5, 102], [4, 19.5, 103], [4, 49.5, 104], [4, 74.5, 105],
    [5, 0.5, 106], [5, 2.5, 107], [5, 4.5, 108], [5, 9.5, 109], [5, 19.5, 110], [5, 49.5, 111], [5, 74.5, 112],
    [6, 0.5, 113], [6, 1.5, 114], [6, 2.5, 115], [6, 4.5, 116], [6, 9.5, 117], [6, 14.5, 118], [6, 24.5, 119],
    [7, 0.5, 120], [7, 1.5, 121], [7, 2.5, 122], [7, 4.5, 123], [7, 9.5, 124], [7, 14.5, 125], [7, 24.5, 126],
    [8, 0.5, 127], [8, 1.5, 128], [8, 2.5, 129], [8, 4.5, 130], [8, 9.5, 131], [8, 19.5, 132], [8, 24.5, 133],
    [9, 0.5, 134], [9, 1.5, 135], [9, 2.5, 136], [9, 4.5, 137], [9, 9.5, 138], [9, 19.5, 139], [9, 24.5, 140],
    [10, 0.5, 141], [10, 1.5, 142], [10, 2.5, 143], [10, 4.5, 144], [10, 9.5, 145], [10, 19.5, 146], [10, 24.5, 147]
];

const challengeCompletionsNotAuto: Record<number, [string, number]> = {
    1: ['1e1000', 75],
    2: ['1e1000', 76],
    3: ['1e99999', 77],
    5: ['1e120000', 63]
}

export const challengeachievementcheck = (i: number, auto?: boolean) => {
    const generatorcheck = sumContents(player.upgrades.slice(101, 106));

    for (const [, bar, ach] of challengeCompletionsBar.filter(([o]) => o === i)) {
        if (player.challengecompletions[i] > bar && player.achievements[ach] < 1) {
            achievementaward(ach);
        }
    }

    // Challenges 1, 2, 3 check for not buying generators and getting X coins
    // Challenge 5 check for not buying Acc/Acc Boosts and getting 1.00e120,000 coins
    if ([1, 2, 3, 5].includes(i) && !auto) {
        const [gte, ach] = challengeCompletionsNotAuto[i];
        if (i === 5) {
            if (player.coinsThisTranscension.gte(gte) && player.acceleratorBought === 0 && player.acceleratorBoostBought === 0) {
                achievementaward(ach)
            }
        } else if (player.coinsThisTranscension.gte(gte) && generatorcheck === 0) {
            achievementaward(ach);
        }
    }

    if (i >= 11 && i <= 14) {
        const challengeArray = [0, 1, 2, 3, 5, 10, 20, 30]
        for (let j = 1; j <= 7; j++) {
            if (player.challengecompletions[i] >= challengeArray[j] && player.achievements[119 + 7 * i + j] < 1) {
                achievementaward(119 + 7 * i + j)
            }
        }
    }

    if (i === 15) {
        const challenge15Score = [1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24];
        for (let i = 0; i < 7; i++) {
            if (player.challenge15Exponent >= challenge15Score[i] && player.achievements[274 + i] < 1) {
                achievementaward(274 + i);
            }
        }
    }

    if (player.challengecompletions[10] >= 50 && i === 11 && player.usedCorruptions[7] >= 5 && player.achievements[247] < 1) {
        achievementaward(247)
    }
}

// \) \{\n\s+achievementaward\(\d+\)\n\s+\}

/**
 * Requirements for each building achievement
 * @type {(() => boolean)[]}
 */
const buildAchievementReq: (() => boolean)[] = [
    () => (player.firstOwnedCoin >= 1 && player.achievements[1] < 0.5),
    () => (player.firstOwnedCoin >= 10 && player.achievements[2] < 0.5),
    () => (player.firstOwnedCoin >= 100 && player.achievements[3] < 0.5),
    () => (player.firstOwnedCoin >= 1000 && player.achievements[4] < 0.5),
    () => (player.firstOwnedCoin >= 5000 && player.achievements[5] < 0.5),
    () => (player.firstOwnedCoin >= 10000 && player.achievements[6] < 0.5),
    () => (player.firstOwnedCoin >= 20000 && player.achievements[7] < 0.5),
    () => (player.secondOwnedCoin >= 1 && player.achievements[8] < 0.5),
    () => (player.secondOwnedCoin >= 10 && player.achievements[9] < 0.5),
    () => (player.secondOwnedCoin >= 100 && player.achievements[10] < 0.5),
    () => (player.secondOwnedCoin >= 1000 && player.achievements[11] < 0.5),
    () => (player.secondOwnedCoin >= 5000 && player.achievements[12] < 0.5),
    () => (player.secondOwnedCoin >= 10000 && player.achievements[13] < 0.5),
    () => (player.secondOwnedCoin >= 20000 && player.achievements[14] < 0.5),
    () => (player.thirdOwnedCoin >= 1 && player.achievements[15] < 0.5),
    () => (player.thirdOwnedCoin >= 10 && player.achievements[16] < 0.5),
    () => (player.thirdOwnedCoin >= 100 && player.achievements[17] < 0.5),
    () => (player.thirdOwnedCoin >= 1000 && player.achievements[18] < 0.5),
    () => (player.thirdOwnedCoin >= 5000 && player.achievements[19] < 0.5),
    () => (player.thirdOwnedCoin >= 10000 && player.achievements[20] < 0.5),
    () => (player.thirdOwnedCoin >= 20000 && player.achievements[21] < 0.5),
    () => (player.fourthOwnedCoin >= 1 && player.achievements[22] < 0.5),
    () => (player.fourthOwnedCoin >= 10 && player.achievements[23] < 0.5),
    () => (player.fourthOwnedCoin >= 100 && player.achievements[24] < 0.5),
    () => (player.fourthOwnedCoin >= 1000 && player.achievements[25] < 0.5),
    () => (player.fourthOwnedCoin >= 5000 && player.achievements[26] < 0.5),
    () => (player.fourthOwnedCoin >= 10000 && player.achievements[27] < 0.5),
    () => (player.fourthOwnedCoin >= 20000 && player.achievements[28] < 0.5),
    () => (player.fifthOwnedCoin >= 1 && player.achievements[29] < 0.5),
    () => (player.fifthOwnedCoin >= 10 && player.achievements[30] < 0.5),
    () => (player.fifthOwnedCoin >= 66 && player.achievements[31] < 0.5),
    () => (player.fifthOwnedCoin >= 666 && player.achievements[32] < 0.5),
    () => (player.fifthOwnedCoin >= 6666 && player.achievements[33] < 0.5),
    () => (player.fifthOwnedCoin >= 17777 && player.achievements[34] < 0.5),
    () => (player.fifthOwnedCoin >= 42777 && player.achievements[35] < 0.5)
];

export const buildingAchievementCheck = () => {
    for (const req of buildAchievementReq) {
        if (req()) {
            const idx = buildAchievementReq.indexOf(req) + 1;
            achievementaward(idx);
        }
    }
}

export const ascensionAchievementCheck = (i: number, score = 0) => {
    if (i === 1) {
        const ascendCountArray = [0, 1, 2, 10, 100, 1000, 14142, 141421, 1414213, //Column 1
            1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13] //Column 2
        for (let j = 1; j <= 7; j++) {
            if (player.ascensionCount >= ascendCountArray[j] && player.achievements[182 + j] < 1) {
                achievementaward(182 + j)
            }
            if (player.ascensionCount >= ascendCountArray[j + 8] && player.achievements[259 + j] < 1) {
                achievementaward(259 + j)
            }
        }
        if (player.ascensionCount >= ascendCountArray[8] && player.achievements[240] < 1) {
            achievementaward(240)
        }
    }
    if (i === 2) {
        const constantArray = [0, 3.14, 1e6, 4.32e10, 6.9e21, 1.509e33, 1e66, '1.8e308', //Column 1
            '1e1000', '1e5000', '1e15000', '1e50000', '1e100000', '1e300000', '1e1000000'] //Column 2
        for (let j = 1; j <= 7; j++) {
            if (player.ascendShards.gte(constantArray[j]) && player.achievements[189 + j] < 1) {
                achievementaward(189 + j)
            }
            if (player.ascendShards.gte(constantArray[j + 7]) && player.achievements[266 + j] < 1) {
                achievementaward(266 + j)
            }
        }
    }
    if (i === 3) {
        const scoreArray = [0, 1e5, 1e6, 1e7, 1e8, 1e9, 5e9, 2.5e10, //Column 1
            1e12, 1e14, 1e17, 2e18, 4e19, 1e21, 1e23] //Column 2
        for (let j = 1; j <= 7; j++) {
            if (score >= scoreArray[j] && player.achievements[224 + j] < 1) {
                achievementaward(224 + j)
            }

            if (score >= scoreArray[7 + j] && player.achievements[252 + j] < 1) {
                achievementaward(252 + j)
            }
        }
    }
}

export const getAchievementQuarks = (i: number) => {
    let multiplier = 1
    if (i >= 183) {
        multiplier = 5
    }
    if (i >= 253) {
        multiplier = 40
    }

    const globalQuarkMultiplier = player.worlds.applyBonus(1)
    let actualMultiplier = multiplier * globalQuarkMultiplier;
    if (actualMultiplier > 100) {
        actualMultiplier = Math.pow(100, 0.6) * Math.pow(actualMultiplier, 0.4)
    }

    return Math.floor(achievementpointvalues[i] * actualMultiplier)
}

export const achievementdescriptions = (i: number) => {
    const x = `[${i}] `;
    const y = adesc[i as keyof typeof adesc]!;
    const z = player.achievements[i] > 0.5 ? ' COMPLETED!' : '';
    const k = areward(i)

    DOMCacheGetOrSet('achievementdescription').textContent = x + y + z
    DOMCacheGetOrSet('achievementreward').textContent = 'Reward: ' + achievementpointvalues[i] + ' AP. ' + format(getAchievementQuarks(i), 0, true) + ' Quarks! ' + k
    if (player.achievements[i] > 0.5) {
        DOMCacheGetOrSet('achievementdescription').style.color = 'gold'
    } else {
        DOMCacheGetOrSet('achievementdescription').style.color = 'white'
    }
}

export const achievementaward = (num: number) => {
    if (player.achievements[num] < 1) {
        if (player.toggles[34]) {
            void Notification(`You unlocked an achievement: [${num}] ${adesc[num as keyof typeof adesc]!}`);
        }

        void achievementAlerts(num)
        player.achievementPoints += achievementpointvalues[num]
        player.worlds.add(getAchievementQuarks(num), false)
        achievementProgress();
        player.achievements[num] = 1;
        revealStuff()

        DOMCacheGetOrSet(`ach${num}`).style.backgroundColor = 'green';
        Synergism.emit('achievement', num);
    }
}

export const achievementProgress = () => {
    DOMCacheGetOrSet('achievementprogress').textContent = `Achievement Points: ${format(player.achievementPoints, 0, true)}/${format(totalachievementpoints, 0, true)} [${format(100 * player.achievementPoints / totalachievementpoints, 2)}%]`;
}

export const totalAchievementPoints = () => {
    let maxCount = 182;
    if (player.ascensionCount > 0) {
        maxCount = 280;
    }
    if (player.highestSingularityCount > 0) {
        maxCount = maxAchievements;
    }
    return achievementpointvalues.reduce((a, b, c) => (a + (b * +(c <= maxCount))), 0);
}

export const resetAchievementPoints = () => {
    totalachievementpoints = totalAchievementPoints();
    player.achievementPoints = achievementpointvalues.reduce((a, b, c) => (a + (b * +(player.achievements[c] > 0.5))), 0);
    achievementProgress();
}
