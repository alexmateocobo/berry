import type { NavigatorScreenParams } from '@react-navigation/native';

export type SwipeContext = {
  type: 'self' | 'group' | 'user';
  id: string;
  label: string;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Social: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  EventDetail: { eventId: string };
  UserProfile: { userId: string };
  GroupPage: { groupId: string };
  SwipeDeck: { context: SwipeContext };
  Search: undefined;
  Filters: undefined;
  Follows: undefined;
  Requests: undefined;
  Likes: { eventId?: string };
  ManageInvitations: undefined;
  MyEvents: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  NotificationSettings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
