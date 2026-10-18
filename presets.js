/**
 * ══════════════════════════════════════════════════════════════════
 * NARRATRIX AI — PRESETS & DATA DEFINITIONS (presets.js)
 * ══════════════════════════════════════════════════════════════════
 *
 * This file contains pure data definitions and templates:
 * - GENRES: Available story genres for combobox selection
 * - CHARACTER_ROLES: Standard archetype roles for ensemble casting
 * - LENGTH_PRESETS: Word count targets and LLM token allocations
 * - PRESETS: Pre-configured story recipes with characters & twists
 *
 * Separated from app.js to keep the AI engine clean, readable,
 * and easy to explain during code evaluations.
 */

/** Standard narrative roles for character cards */
const CHARACTER_ROLES = [
  'Protagonist',
  'Antagonist',
  'Deuteragonist / Foil',
  'Companion / Sidekick',
  'Mentor',
  'Rival',
  'Wildcard / Supporting',
];

/** Target story length profiles with word count directives */
const LENGTH_PRESETS = {
  flash: {
    id: 'flash',
    label: 'Flash Fiction (~300–500 words)',
    tokens: 1024,
    directive: 'TARGET LENGTH: Flash fiction (~300–500 words). Produce a punchy, atmospheric, self-contained scene with high sensory economy. No unnecessary filler.',
  },
  standard: {
    id: 'standard',
    label: 'Full Scene (~800–1,200 words)',
    tokens: 2500,
    directive: 'TARGET LENGTH: Full scene (~800–1,200 words). Develop the environment, character interiority, sensory layers, and a complete narrative arc with deliberate pacing.',
  },
  extended: {
    id: 'extended',
    label: 'Extended Epic (~1,500+ words)',
    tokens: 4096,
    directive: 'TARGET LENGTH: Extended epic (~1,500+ words). Provide an immersive, deeply textured narrative with rich secondary actions, layered dialogue, extensive worldbuilding, and emotional depth.',
  },
};

/** All supported story genres for combobox and prompt customization */
const GENRES = [
  'Key & Peele Absurdist Satire',
  'Real-Life "What If...?" Divergence',
  'The Twilight Zone (Anthology Parable)',
  'Bedtime Story',
  'Cozy Mystery',
  'Whimsical Fable',
  'Romance',
  'Slice of Life',
  'Adventure / Exploration',
  'Mythological Folktale',
  'Cyberpunk',
  'Cosmic Horror',
  'Dark Fantasy',
  'Hard Science Fiction',
  'Space Opera',
  'Steampunk',
  'Biopunk',
  'Solarpunk',
  'Alternate History',
  'Dystopian',
  'Post-Apocalyptic',
  'Military Sci-Fi',
  'Urban Fantasy',
  'Gothic Horror',
  'Weird Fiction',
  'Climate Fiction',
  'Time Travel',
  'First Contact',
  'Sword & Sorcery',
  'Noir',
];

/**
 * Rich preset templates organized into distinct aesthetic categories.
 * Each preset defines a genre, default target length, cast ensemble,
 * turning point twists, and initial narrative seed prompt.
 */
const PRESETS = [
  // ── Universal & Cozy ──
  {
    id: 'bedtime-story',
    category: 'Universal & Cozy',
    name: 'Bedtime Story',
    icon: '🌙',
    desc: 'Gentle, soothing fable to unwind and drift off to sleep.',
    genre: 'Bedtime Story',
    length: 'flash',
    characters: [
      { name: 'Barnaby the Star-Tender', role: 'Protagonist', traits: 'Kind, walks in soft wool slippers, speaks in calm whispers' },
      { name: 'Stella the Little Star', role: 'Companion / Sidekick', traits: 'Sleepy fallen star, sneezes golden dust when tired' },
    ],
    twists: [
      'Stella didn\'t fall from the sky by accident; she was searching for the star-tender\'s famous chamomile tea.',
      'When Stella drinks the tea, her glow gently warms the entire pine valley into a deep slumber.',
    ],
    prompt: 'Write a gentle, comforting bedtime tale about Barnaby, an old celestial caretaker who polishes sleepy stars above an enchanted pine valley before tucking them in for the night.',
  },
  {
    id: 'cozy-mystery',
    category: 'Universal & Cozy',
    name: 'Cozy Seaside Mystery',
    icon: '🔍',
    desc: 'Rainy coastal village, charming tea shop, and a missing heirloom.',
    genre: 'Cozy Mystery',
    length: 'standard',
    characters: [
      { name: 'Penelope Thorn', role: 'Protagonist', traits: 'Retired librarian, sharp eye for missing dust jackets, knit-cardigan enthusiast' },
      { name: 'Jasper the Ginger Cat', role: 'Companion / Sidekick', traits: 'Uncannily perceptive feline who sits only on suspicious books' },
      { name: 'Lord Sterling', role: 'Rival', traits: 'Local eccentric aristocrat who insists his missing music box was taken by sea sprites' },
    ],
    twists: [
      'The missing antique music box was hidden inside Jasper\'s cat bed all along.',
      'Inside the hollow cylinder of the music box is a love letter that exonerates Penelope\'s sister from an old village scandal.',
    ],
    prompt: 'On a stormy Tuesday morning in St. Jude-by-the-Sea, Penelope opens the High Tide Bookshop to discover the village heirloom music box sitting on the counter — playing a melody that hasn\'t been heard in forty years.',
  },
  {
    id: 'whimsical-fable',
    category: 'Universal & Cozy',
    name: 'Whimsical Animal Fable',
    icon: '🦊',
    desc: 'Clever forest creatures, miniature tea parties, and gentle life lessons.',
    genre: 'Whimsical Fable',
    length: 'flash',
    characters: [
      { name: 'Barnaby Quill', role: 'Protagonist', traits: 'Anxious porcupine tailor who makes waistcoats for voles' },
      { name: 'Madame Vivienne Owl', role: 'Mentor', traits: 'Haughty night-school headmistress with spectacles perched on her beak' },
    ],
    twists: [
      'The silk Barnaby was using to sew the Mayor\'s gala jacket wasn\'t silk — it was spun moonlight that fades at dawn.',
      'The townspeople love the invisible glowing stitches more than traditional thread.',
    ],
    prompt: 'Barnaby the hedgehog tailor is tasked with sewing a coat for the annual Autumn Solstice banquet, but his quill needles keep piercing the dandelion silk.',
  },
  {
    id: 'romance',
    category: 'Universal & Cozy',
    name: 'Contemporary Romance',
    icon: '☕',
    desc: 'Second chances, rainy bookstore cafes, and unspoken chemistry.',
    genre: 'Romance',
    length: 'standard',
    characters: [
      { name: 'Clara Hughes', role: 'Protagonist', traits: 'Independent bookstore owner, quick wit, guarded heart' },
      { name: 'Julian Vance', role: 'Deuteragonist / Foil', traits: 'Architect overseeing city renovations, quiet, observant, remembers obscure details' },
    ],
    twists: [
      'Julian is the anonymous customer who has been ordering rare out-of-print poetry books every week.',
      'The historic preservation order that saved Clara\'s building was drafted secretly by Julian.',
    ],
    prompt: 'When a torrential downpour traps Julian inside Clara\'s closing bookstore for forty-five minutes, an accidental spilled cup of Earl Grey forces a conversation ten years in the making.',
  },

  // ── Adventure & Myth ──
  {
    id: 'lost-temple',
    category: 'Adventure & Myth',
    name: 'Lost Temple Adventure',
    icon: '🧭',
    desc: 'Dense jungle canopy, crumbling ruins, and an ancient mechanism.',
    genre: 'Adventure / Exploration',
    length: 'standard',
    characters: [
      { name: 'Captain Lucas Drake', role: 'Protagonist', traits: 'Quick-witted adventurer, weathered leather jacket, wary of scorpions' },
      { name: 'Elena Rios', role: 'Rival', traits: 'Ruthless rival archaeologist, armed with ancient dialects and smoke grenades' },
    ],
    twists: [
      'The temple\'s booby traps were designed to keep something inside, not intruders out.',
      'Elena reveals that her expedition was funded by Lucas\'s estranged father.',
    ],
    prompt: 'Lucas and his guide light their torches inside the subterranean Cenote of the Sun God, triggering a ring of hydraulic stone gears and an ancient warning etched in obsidian.',
  },
  {
    id: 'mythological-folktale',
    category: 'Adventure & Myth',
    name: 'Mythological Folktale',
    icon: '🏔️',
    desc: 'Ancient mountain spirits, sacred oaths, and ancestral wisdom.',
    genre: 'Mythological Folktale',
    length: 'standard',
    characters: [
      { name: 'Kaori of the Mist Valley', role: 'Protagonist', traits: 'Dutiful hunter, speaks the language of mountain hawks, unyielding honor' },
      { name: 'The White Stag', role: 'Wildcard / Supporting', traits: 'Immortal spirit of Mount Hiei, whose breath turns winter into spring' },
    ],
    twists: [
      'The village elders knew hunting the stag would trigger an eternal avalanche.',
      'Kaori snaps her bow in two, choosing exile to become the mountain\'s sworn guardian.',
    ],
    prompt: 'Kaori tracks the legendary Winter Stag to the highest ridge of Mount Hiei, where the wind turns to human voices carrying ancestral warnings.',
  },
  {
    id: 'dark-fantasy',
    category: 'Adventure & Myth',
    name: 'Dark Fantasy',
    icon: '🏰',
    desc: 'Fae bargains, cursed knights, and memories for sale.',
    genre: 'Dark Fantasy',
    length: 'standard',
    characters: [
      { name: 'Seraphine the Unsworn', role: 'Protagonist', traits: 'Disgraced knight, stoic exterior, consumed by guilt' },
      { name: 'Lord Vane of the Pale Court', role: 'Antagonist', traits: 'Fae noble with porcelain skin, deals strictly in emotional collateral' },
    ],
    twists: [
      'The cure Seraphine seeks costs the memory of the very person she is trying to save.',
      'Lord Vane was once the human knight who taught Seraphine her sword forms.',
    ],
    prompt: 'Seraphine enters the Thornwood to bargain with the Pale Court — fae creatures who trade in memories. Write the negotiation scene.',
  },

  // ── Speculative & Sci-Fi ──
  {
    id: 'cyberpunk-noir',
    category: 'Speculative & Sci-Fi',
    name: 'Cyberpunk Noir',
    icon: '🌌',
    desc: 'Rain-soaked streets, neural implants, and data smuggling.',
    genre: 'Cyberpunk',
    length: 'standard',
    characters: [
      { name: 'Kael "Ghost" Mercer', role: 'Protagonist', traits: 'Cynical ex-netrunner, augmented optics, haunted by erased memories' },
      { name: 'Director Aris Thorne', role: 'Antagonist', traits: 'Corporate security chief, wears tailored synth-silk, speaks in polite euphemisms' },
    ],
    twists: [
      'The data payload Ghost is smuggling contains their own deleted consciousness from 5 years ago.',
      'Director Thorne didn\'t dispatch strike teams to stop the delivery — he hired Ghost to deliver it to himself.',
    ],
    prompt: 'Ghost ducks into an automated noodle stall in the neon underbelly of Sector 4 to decrypt a stolen memory shard before their retinal displays flatline.',
  },
  {
    id: 'solarpunk',
    category: 'Speculative & Sci-Fi',
    name: 'Solarpunk Solstice',
    icon: '🌱',
    desc: 'Living architecture, mycelial grids, and communal harmony.',
    genre: 'Solarpunk',
    length: 'standard',
    characters: [
      { name: 'Lien Nakamura', role: 'Protagonist', traits: 'Idealistic bio-architect, deeply empathic, talks to their creations' },
      { name: 'The Sumida Spire', role: 'Companion / Sidekick', traits: 'A conscious living bridge of engineered coral and bioluminescent mycelium' },
    ],
    twists: [
      'The bridge is not malfunctioning — its neural mesh has begun harmonizing with the heartbeat of the river fish.',
      'Lien realizes the city\'s energy grid can be powered entirely by the bridge\'s acoustic resonance.',
    ],
    prompt: 'In rewilded Tokyo of 2150, Lien grows a living bridge across the Sumida River using engineered coral and mycelium. Write the moment the bridge begins to dream.',
  },
  {
    id: 'cosmic-horror',
    category: 'Speculative & Sci-Fi',
    name: 'Cosmic Horror',
    icon: '⏳',
    desc: 'Incomprehensible geometry and the erosion of sanity.',
    genre: 'Cosmic Horror',
    length: 'standard',
    characters: [
      { name: 'Dr. Iris Vey', role: 'Protagonist', traits: 'Brilliant xenogeologist, obsessive, fragile grip on reality' },
      { name: 'Chief Engineer Miller', role: 'Companion / Sidekick', traits: 'Grounded blue-collar miner, religious, clutching an old brass locket' },
    ],
    twists: [
      'The impossible angles inside the asteroid core are not geological formations — they are the fossilized thoughts of a slumbering entity.',
      'Miller\'s locket has begun ticking in reverse, synchronizing with the asteroid\'s pulse.',
    ],
    prompt: 'A deep-space mining crew cracks open an asteroid and finds angles that fold inward through dimensions the human eye cannot track. Describe Dr. Vey\'s unravelling.',
  },
  {
    id: 'alt-history',
    category: 'Speculative & Sci-Fi',
    name: 'Alt-History',
    icon: '🕰️',
    desc: 'Missile crises, irradiated ruins, and shadow agents.',
    genre: 'Alternate History',
    length: 'standard',
    characters: [
      { name: 'Agent Marisol Vega', role: 'Protagonist', traits: 'Resourceful, morally ambiguous, war-scarred survivor' },
      { name: 'Major Nikolai Rostov', role: 'Rival', traits: 'KGB tactician, weary of endless conflict, loves American jazz records' },
    ],
    twists: [
      'Both superpowers\' automated defense computers were triggered by an untracked asteroid shower, not a first strike.',
      'Vega and Rostov forge a fake presidential authorization to deactivate the second wave of atomic silos.',
    ],
    prompt: '1962 — the Cuban Missile Crisis escalated. Two rival agents meet in the irradiated ruins of Washington D.C. to negotiate a fragile ceasefire.',
  },

  // ── Satire, Divergence & Anthology ──
  {
    id: 'key-and-peele-satire',
    category: 'Satire, Divergence & Anthology',
    name: 'Key & Peele Absurdist Satire',
    icon: '🎬',
    desc: 'A trivial social interaction spirals into deadly serious, operatic psychological warfare.',
    genre: 'Key & Peele Absurdist Satire',
    length: 'standard',
    characters: [
      { name: 'Marcus Vance', role: 'Protagonist', traits: 'Polite, soft-spoken diner patron who simply requested the table salt with modest courtesy' },
      { name: 'Chef Jean-Luc Laurent', role: 'Antagonist', traits: 'Hyper-intense bistro chef who treats asking for salt as an existential declaration of war' },
      { name: 'Detective Brody', role: 'Wildcard / Supporting', traits: 'Weary hostage negotiator eating soup in the corner booth who instinctively intervenes' },
    ],
    twists: [
      'Jean-Luc wheels out a biometric titanium vault containing a single 200-year-old pink salt rock and demands Marcus recite the culinary pledge of allegiance.',
      'Marcus calmly produces a tactical pocket grinder, revealing he is an undercover Michelin inspector with zero tolerance for ego.',
    ],
    prompt: 'In an aggressively upscale bistro, Marcus politely asks Chef Jean-Luc for table salt. Write the scene as an escalating, deadpan psychological thriller where neither man will yield an inch of ground, treating the condiment dispute as an international diplomatic standoff with escalating cinematic stakes.',
  },
  {
    id: 'real-life-what-if',
    category: 'Satire, Divergence & Anthology',
    name: 'Real-Life "What If...?" Divergence',
    icon: '👁️',
    desc: 'An omniscient chronicler tracks the 1983 Soviet nuclear false alarm nexus point.',
    genre: 'Real-Life "What If...?" Divergence',
    length: 'extended',
    characters: [
      { name: 'The Cosmic Chronicler', role: 'Wildcard / Supporting', traits: 'Omniscient, detached observer watching human history branch across fragile nexus points' },
      { name: 'Lt. Col. Stanislav Petrov', role: 'Protagonist', traits: 'Soviet air defense officer on duty at Serpukhov-15 bunker; analytical, heavy smoker, burdened with the weight of civilization' },
      { name: 'Duty Officer Evgeny', role: 'Deuteragonist / Foil', traits: 'Young subordinate technician, panicking as alarms flash red, pleading to follow the automated retaliatory protocol' },
    ],
    twists: [
      'The automated OKO satellite telemetry confirms a second salvo of four missiles, but Petrov spots a subtle mathematical discrepancy in the satellite elevation angle.',
      'A command hotline telephone cable experiences a momentary power drop, leaving Petrov in absolute isolation during the final four minutes of decision.',
    ],
    prompt: 'Framed through the voice of an omniscient observer: September 26, 1983. Inside the secret Serpukhov-15 bunker south of Moscow, early-warning monitors scream that five American ICBMs have been launched. Chronicle the ten excruciating minutes where Lt. Colonel Stanislav Petrov gambled the survival of our species on the hunch that the computers were lying.',
  },
  {
    id: 'twilight-zone-parable',
    category: 'Satire, Divergence & Anthology',
    name: 'The Twilight Zone (Anthology Parable)',
    icon: '🌀',
    desc: 'An eerie moral puzzle introduced with iconic Serling/Peele prologue and epilogue.',
    genre: 'The Twilight Zone (Anthology Parable)',
    length: 'standard',
    characters: [
      { name: 'Arthur Pendelton', role: 'Protagonist', traits: 'Ruthless Manhattan efficiency auditor who measures human dignity strictly in unbilled billable minutes' },
      { name: 'The Attendant', role: 'Wildcard / Supporting', traits: 'Enigmatic vintage elevator operator in a 1930s art-deco skyscraper who gifts an antique pocket watch' },
    ],
    twists: [
      'Every minute Arthur steals and stores using the watch is physically deducted from the lifespan of whoever he is speaking with.',
      'When Arthur tries to smash the watch to break the curse, the elevator doors slide open onto the empty hallway of his elementary school on the day he decided never to waste time.',
    ],
    prompt: 'A merciless corporate efficiency expert is handed an antique pocket watch by an elevator attendant in an art-deco skyscraper. Frame the story with classic Twilight Zone prologue narration ("Submitted for your approval..."), escalate the uncanny moral dilemma, and close with an ominous epilogue reflecting on the price of stolen time.',
  },
];

// Attach to window object for bulletproof browser accessibility across scripts
if (typeof window !== 'undefined') {
  window.CHARACTER_ROLES = CHARACTER_ROLES;
  window.LENGTH_PRESETS  = LENGTH_PRESETS;
  window.GENRES          = GENRES;
  window.PRESETS         = PRESETS;
}
