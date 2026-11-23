/** Lines from the HOMOVERSE story bible (22 Nov 2026), adapted for Golden Hour. No token or payout promises. */

export type NpcId = 'laurent' | 'jules' | 'wes' | 'simon' | 'guest';

export const NPC_META: Record<NpcId, { name: string; role: string }> = {
  laurent: { name: 'Laurent', role: 'Concierge of the Golden Hour Lounge' },
  jules: { name: 'Jules Wren', role: 'Shopkeeper of the ring' },
  wes: { name: 'Wes Holloway', role: 'A regular on the plaza bench' },
  simon: { name: 'Simon', role: "Host of the Members' Lounge" },
  guest: { name: 'You', role: 'A guest of the house' },
};

export const NPC_LINES: Record<NpcId, string[]> = {
  laurent: [
    'There you are. I was beginning to think the lighting was only for me.',
    'Welcome to the house. Black, gold, and a little cold pink in the sky — as intended.',
    'Come in, darling. The rope is velvet. The standards are not.',
    "Golden Hour is just ahead. I'll be here when you want the door.",
    'Good evening. I keep the greeting, not the ledger.',
    "If you're asking about price or tokens, that's not a conversation I will have. The room is still yours.",
    "Owned by all of us. That's the welcome, not a prospectus.",
    'Take a turn around the ring. The plaza looks expensive on everyone.',
  ],
  jules: [
    'Stand there. The mirror is being kind tonight.',
    "Black is the jacket. Gold is the point. That blush in the window is just the hour.",
    "If it doesn't feel like you, we don't leave with it.",
    'homoGAP is next door when you want the house mark on something you can actually wear.',
    "Easy — it's a fitting, not a trial.",
    'Some things are worth unlocking. A gold key, a better shoulder. That’s the list.',
    'Your guy can sit. You can turn. I’ll watch the break.',
    'Find your fit together. That’s the whole speech.',
  ],
  wes: [
    'I need coffee. Then I need another ten minutes of this sky.',
    "This promenade is giving. I'll give it that.",
    "There's room on the bench. I don't bite, and I don't do forecasts.",
    'Dusk does the mauve for free. Very on brand of it.',
    "If you're lost, you're not. Golden Hour is the middle of the thought.",
    'I come for the lamps and stay for the people-watching.',
    'Good company, good weather — even when it looks like rain.',
    "Go on a turn. I'll keep your seat in spirit.",
  ],
  simon: [
    'I saved the corner. The lamp is kinder there.',
    'Sparkling water, unless you tell me otherwise.',
    'The book is just the house — names, evenings, nothing that leaves this room.',
    "Stay as long as the evening lasts. That's the membership that matters.",
    "Welcome back, even if it's your first time.",
    'We keep the volume low and the gold lights lower.',
    'The chair by the velvet is yours if you want it.',
    'No rush. The evening keeps.',
  ],
  guest: [
    'I need coffee.',
    'This promenade is giving.',
    'Black, gold, and that cold pink in the clouds. I can work with this.',
    'Do I go to Golden Hour first, or do I pretend I’m not rushing?',
    'Someone in there knows how a jacket should sit.',
    'I could sit. I could wander. I look expensive either way.',
    'Demo credits, not a story I have to tell at dinner.',
    'I think I belong here. I’ll walk it once more to be sure.',
  ],
};

export function lineAt(id: NpcId, index: number): string {
  const lines = NPC_LINES[id];
  return lines[((index % lines.length) + lines.length) % lines.length];
}

export const RANK_GREETINGS: Record<'member' | 'gold' | 'velvet', string> = {
  member: 'The house knows you. The Members\' Booth is open when you want it.',
  gold: 'Gold at the door. Come in as yourself — the quieter room is yours tonight.',
  velvet: 'Velvet evening. We kept the kinder lamp on for you.',
};
