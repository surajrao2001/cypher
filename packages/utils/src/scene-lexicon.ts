/**
 * Underground dance scene vocabulary used in BYND8 product copy.
 * Common floor language (formats, judging, execution, culture, strategy, energy).
 * Educational framing inspired by scene educators (e.g. Dance Mentor India) —
 * BYND8 does not claim ownership of third-party branded content.
 */

export type SceneTermSection =
  | 'formats'
  | 'judging'
  | 'execution'
  | 'culture'
  | 'strategy'
  | 'energy';

export type SceneTerm = {
  term: string;
  definition: string;
  section: SceneTermSection;
};

export const SCENE_TERM_SECTIONS: Record<
  SceneTermSection,
  { title: string; tagline: string }
> = {
  formats: {
    title: 'Battle formats',
    tagline: 'How a battle is actually structured.',
  },
  judging: {
    title: 'Judging terms',
    tagline: 'How winners are actually decided.',
  },
  execution: {
    title: 'Execution terms',
    tagline: 'What judges actually see in your body.',
  },
  culture: {
    title: 'Culture & respect',
    tagline: 'What separates dancers from the scene.',
  },
  strategy: {
    title: 'Strategy terms',
    tagline: 'Battles are won before you move.',
  },
  energy: {
    title: 'Energy & presence',
    tagline: 'What people remember after you leave.',
  },
};

export const SCENE_TERMS: SceneTerm[] = [
  // Formats
  {
    section: 'formats',
    term: 'Cypher',
    definition: 'Open circle where dancers take turns freestyling. No judges. Just respect.',
  },
  {
    section: 'formats',
    term: 'Prelims',
    definition: 'Solo showcase round to qualify for the bracket.',
  },
  {
    section: 'formats',
    term: '1v1 / Crew',
    definition: 'The format. Solo, pairs, or full crew against another.',
  },
  {
    section: 'formats',
    term: 'Call out',
    definition: 'Publicly challenging one specific dancer.',
  },
  {
    section: 'formats',
    term: 'Exhibition',
    definition: 'A battle danced for the culture, not the trophy.',
  },
  // Judging
  {
    section: 'judging',
    term: 'Point',
    definition: 'Judges point toward the dancer they felt won.',
  },
  {
    section: 'judging',
    term: 'Unanimous',
    definition: 'All judges point the same way. Clean win.',
  },
  {
    section: 'judging',
    term: 'Split decision',
    definition: 'Judges disagree. These are the close ones.',
  },
  {
    section: 'judging',
    term: 'Foundation check',
    definition: 'Judges checking if your basics are real or borrowed.',
  },
  {
    section: 'judging',
    term: 'Crowd reaction',
    definition: 'Not a score. But it changes the room.',
  },
  // Execution
  {
    section: 'execution',
    term: 'Freestyle',
    definition: 'Movement created in the moment, not rehearsed.',
  },
  {
    section: 'execution',
    term: 'Set',
    definition: 'A prepared sequence saved for battle. Use it, don’t depend on it.',
  },
  {
    section: 'execution',
    term: 'Blow up',
    definition: 'A high-energy explosive moment inside a round.',
  },
  {
    section: 'execution',
    term: 'Get down',
    definition: 'Dropping into floor level.',
  },
  {
    section: 'execution',
    term: 'Vocabulary',
    definition: 'Your personal library of moves. Bigger library, better freestyle.',
  },
  // Culture
  {
    section: 'culture',
    term: 'Biting',
    definition: 'Copying someone’s signature move as your own. Fastest way to lose respect.',
  },
  {
    section: 'culture',
    term: 'Props',
    definition: 'Respect given to a dancer. Earned, never demanded.',
  },
  {
    section: 'culture',
    term: 'Burn',
    definition: 'Answering someone so well the round is basically finished.',
  },
  {
    section: 'culture',
    term: 'OG',
    definition: 'A veteran who built the scene before you arrived.',
  },
  {
    section: 'culture',
    term: 'Handshake',
    definition: 'The battle ends when the round ends. Respect after, always.',
  },
  // Strategy
  {
    section: 'strategy',
    term: 'Reading',
    definition: 'Watching your opponent to understand their gaps.',
  },
  {
    section: 'strategy',
    term: 'Answer',
    definition: 'Responding with your version of their move. Higher level.',
  },
  {
    section: 'strategy',
    term: 'Pacing',
    definition: 'Not emptying everything in round one.',
  },
  {
    section: 'strategy',
    term: 'Bombs',
    definition: 'Your strongest moves. Timing matters more than the move.',
  },
  {
    section: 'strategy',
    term: 'Composure',
    definition: 'Staying calm when the crowd gets loud.',
  },
  // Energy
  {
    section: 'energy',
    term: 'Attack',
    definition: 'How you enter. The first three seconds decide attention.',
  },
  {
    section: 'energy',
    term: 'Character',
    definition: 'Your personality showing through movement.',
  },
  {
    section: 'energy',
    term: 'Presence',
    definition: 'Owning space without forcing it.',
  },
  {
    section: 'energy',
    term: 'Momentum',
    definition: 'Energy that builds across the round.',
  },
  {
    section: 'energy',
    term: 'Choking',
    definition: 'Freezing under pressure. Happens to everyone. Train for it.',
  },
];

/** Quick category name chips organizers can tap. */
export const CATEGORY_NAME_SUGGESTIONS = [
  '1v1',
  '2v2',
  'Crew',
  'Prelims',
  'Open',
  'Exhibition',
] as const;

export function sceneTermsFor(section: SceneTermSection): SceneTerm[] {
  return SCENE_TERMS.filter((t) => t.section === section);
}

export function findSceneTerm(term: string): SceneTerm | undefined {
  const key = term.trim().toLowerCase();
  return SCENE_TERMS.find((t) => t.term.toLowerCase() === key);
}
