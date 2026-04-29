// Catalog of levels, CEFR descriptors, skills and example topics.
// Shown on the Levels page and used to seed the Topic field with smart suggestions.

export const LEVELS = [
  {
    key: 'Kindergarten',
    label: 'Kindergarten',
    age: 'Ages 3-5',
    cefr_range: ['Pre-A1', 'A1'],
    blurb: 'Cambridge YLE Pre-Starters / Starters style — sounds, colours, animals, family. Big print, picture-cued worksheets with playful storylines.',
  },
  {
    key: 'Primary',
    label: 'Primary',
    age: 'Ages 6-11',
    cefr_range: ['A1', 'A2'],
    blurb: 'Cambridge YLE Starters / Movers / Flyers style — short stories, simple grammar, everyday vocabulary, recurring Vietnamese characters.',
  },
  {
    key: 'Secondary',
    label: 'Secondary',
    age: 'Ages 12-17',
    cefr_range: ['A2', 'B1', 'B2'],
    blurb: 'KET / PET / FCE-style tasks — modern Vietnamese contexts (Grab, K-pop, university choice), reading comprehension, grammar focus, opinion writing.',
  },
  {
    key: 'IELTS',
    label: 'IELTS',
    age: 'Ages 16+',
    cefr_range: ['B1', 'B2', 'C1'],
    blurb: 'Authentic IELTS task formats — True/False/Not Given, matching headings, sentence completion, Task 1 & 2 writing on academic Vietnam topics.',
  },
];

export const CEFR_DESCRIPTORS = {
  'Pre-A1': { name: 'Pre-Starter', can_do: 'Recognise basic letters, sounds, colours, simple greetings.' },
  A1: { name: 'Breakthrough', can_do: 'Greet, introduce self, ask simple questions about familiar topics.' },
  A2: { name: 'Waystage', can_do: 'Describe family, daily routine, past holidays in short sentences.' },
  B1: { name: 'Threshold', can_do: 'Handle most travel situations; describe experiences and give opinions.' },
  B2: { name: 'Vantage', can_do: 'Interact fluently; argue a viewpoint and weigh advantages.' },
  C1: { name: 'Effective Operational', can_do: 'Express ideas precisely; produce well-structured detailed text.' },
  C2: { name: 'Mastery', can_do: 'Understand virtually everything; express nuance, irony, register.' },
};

export const SKILLS = [
  { key: 'reading', label: 'Reading', icon: '📖', blurb: 'Long passages with mixed comprehension tasks.' },
  { key: 'writing', label: 'Writing', icon: '✍', blurb: 'Model texts plus structured writing prompts.' },
  { key: 'grammar', label: 'Grammar', icon: '⚙', blurb: 'One target structure, three tiers (recognise → drill → produce).' },
  { key: 'vocabulary', label: 'Vocabulary', icon: '📚', blurb: 'Definitions, gap-fill, sentence-formation in context.' },
  { key: 'listening', label: 'Listening', icon: '🎧', blurb: 'Transcript + gist & detail tasks (teacher reads aloud).' },
];

export const TOPIC_BANK = [
  { group: 'Vietnamese culture', items: [
    'Tet holiday traditions',
    'Mid-Autumn Festival (Trung Thu)',
    'Hung Kings Commemoration',
    'A typical morning in Hanoi',
    'Street food in Saigon',
    'A trip to Hoi An',
    'Sapa rice terraces',
    'Lunar New Year family dinner',
    'Banh mi: history and recipe',
    'Ao dai across the years',
  ]},
  { group: 'Daily life (Primary / Secondary)', items: [
    'My daily routine',
    'After-school activities',
    'Helping at home',
    'A visit to grandparents',
    'Going to the market',
    'A day at school',
    'Riding the bus to class',
    'Playing badminton with friends',
    'Saturday cafe study session',
    'Choosing what to wear for a school party',
  ]},
  { group: 'Modern teenage life (B1-B2)', items: [
    'Choosing a university in Hanoi vs Saigon',
    'Friday night Grab to a K-pop concert',
    'My TikTok account: pros and cons',
    'Saving money on coffee',
    'A weekend trip to Da Lat',
    'Should phones be allowed in class?',
    'My favourite Vietnamese gaming streamer',
  ]},
  { group: 'Stories & fun (Kindergarten / Primary)', items: [
    'A talking lotus flower',
    'The lost dragon fruit',
    'Minh and the friendly water buffalo',
    'Lan\u2019s magical conical hat',
    'A story about Halong Bay',
    'The festival in the village',
    'The cat who learned English',
  ]},
  { group: 'Academic / IELTS', items: [
    'Urbanisation in Vietnam',
    'Climate change and the Mekong Delta',
    'Tourism: pros and cons',
    'Technology in education',
    'Renewable energy',
    'Online vs traditional classrooms',
    'Globalisation and local food',
    'AI and the future of work',
  ]},
  { group: 'For parents at home', items: [
    'Describe your bedroom',
    'My family tree',
    'My pet',
    'What I had for breakfast',
    'My favourite cartoon',
    'A weekend with grandparents',
  ]},
];
