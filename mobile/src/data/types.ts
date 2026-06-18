export type Venue = {
  name: string | null;
  address: string | null;
  city: string | null;
};

export type EventItem = {
  id: string;
  url: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: Venue;
  categories: string[];
  tags: string[];
  price: string | null;
  is_free: boolean | null;
  spots_remaining: number | null;
  registration_required: boolean | null;
  image_url: string | null;
  organizer: string | null;
  source: string;
};

export type MockUser = {
  id: string;
  name: string;
  handle: string;
  bio: string;
};

export type MockGroup = {
  id: string;
  name: string;
  memberIds: string[];
  eventIds: string[];
};

export type GroupInvitation = {
  id: string;
  group: MockGroup;
  invitedBy: MockUser;
};
