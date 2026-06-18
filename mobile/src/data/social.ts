import type { GroupInvitation, MockGroup, MockUser } from './types';

export const CURRENT_USER: MockUser = {
  id: 'me',
  name: 'Alex Cobo',
  handle: '@alexc',
  bio: 'Exploring Munich one event at a time.',
};

export const FOLLOWS: MockUser[] = [
  { id: 'u1', name: 'Mara Lindgren', handle: '@mara.l', bio: 'Techno & sauna rave enthusiast.' },
  { id: 'u2', name: 'Jonas Brandt', handle: '@jbrandt', bio: 'Always down for a Biergarten.' },
  { id: 'u3', name: 'Priya Nair', handle: '@priya.nair', bio: 'Startup nights + brunch dates.' },
  { id: 'u4', name: 'Felix Huber', handle: '@felixh', bio: 'Ilian Tape fan since day one.' },
  { id: 'u5', name: 'Sophie Wagner', handle: '@sophiew', bio: 'Wellness, walks, and weekend markets.' },
];

export const FOLLOW_REQUESTS: MockUser[] = [
  { id: 'u6', name: 'Leon Acker', handle: '@leon.acker', bio: 'New to Munich, exploring the scene.' },
  { id: 'u7', name: 'Nina Costa', handle: '@nina.costa', bio: 'Food, music, and good company.' },
];

const GROUP_TECHNO: MockGroup = {
  id: 'g1',
  name: 'Techno Crew',
  memberIds: ['me', 'u1', 'u4'],
  eventIds: ['evt-01', 'evt-02', 'evt-03', 'evt-16'],
};

const GROUP_BRUNCH: MockGroup = {
  id: 'g2',
  name: 'Brunch & Chill',
  memberIds: ['me', 'u3', 'u5'],
  eventIds: ['evt-10', 'evt-11', 'evt-12'],
};

const GROUP_FOUNDERS: MockGroup = {
  id: 'g3',
  name: 'Founders Munich',
  memberIds: ['me', 'u2', 'u3'],
  eventIds: ['evt-13', 'evt-15'],
};

const GROUP_SAUNA: MockGroup = {
  id: 'g4',
  name: 'Sauna Society',
  memberIds: ['u4', 'u5'],
  eventIds: ['evt-14'],
};

export const GROUPS: MockGroup[] = [GROUP_TECHNO, GROUP_BRUNCH, GROUP_FOUNDERS];

const ALL_GROUPS: MockGroup[] = [GROUP_TECHNO, GROUP_BRUNCH, GROUP_FOUNDERS, GROUP_SAUNA];

export const GROUP_INVITATIONS: GroupInvitation[] = [
  { id: 'inv-1', group: GROUP_SAUNA, invitedBy: FOLLOWS.find((user) => user.id === 'u4')! },
];

export const LIKED_EVENT_IDS: string[] = ['evt-01', 'evt-04', 'evt-08', 'evt-11', 'evt-14'];

export const MY_EVENTS = {
  going: ['evt-01', 'evt-13'],
  interested: ['evt-06', 'evt-09', 'evt-11', 'evt-14'],
};

const ALL_USERS: MockUser[] = [CURRENT_USER, ...FOLLOWS, ...FOLLOW_REQUESTS];

export function getUserById(id: string): MockUser | undefined {
  return ALL_USERS.find((user) => user.id === id);
}

export function getGroupById(id: string): MockGroup | undefined {
  return ALL_GROUPS.find((group) => group.id === id);
}
