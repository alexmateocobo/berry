import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import { EventDetailScreen } from '../screens/shared/EventDetailScreen';
import { UserProfileScreen } from '../screens/shared/UserProfileScreen';
import { SearchScreen } from '../screens/shared/SearchScreen';
import { FiltersScreen } from '../screens/shared/FiltersScreen';
import { SwipeDeckScreen } from '../screens/discover/SwipeDeckScreen';
import { GroupScreen } from '../screens/social/GroupScreen';
import { RequestsScreen } from '../screens/social/RequestsScreen';
import { LikesScreen } from '../screens/social/LikesScreen';
import { ManageInvitationsScreen } from '../screens/social/ManageInvitationsScreen';
import { MyEventsScreen } from '../screens/profile/MyEventsScreen';
import { FollowsScreen } from '../screens/profile/FollowsScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { AccountSettingsScreen } from '../screens/profile/AccountSettingsScreen';
import { NotificationSettingsScreen } from '../screens/profile/NotificationSettingsScreen';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { ...typography.heading, color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="GroupPage" component={GroupScreen} options={{ title: 'Group' }} />
      <Stack.Screen name="SwipeDeck" component={SwipeDeckScreen} options={{ title: 'Swipe' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="Filters" component={FiltersScreen} options={{ title: 'Filters' }} />
      <Stack.Screen name="Follows" component={FollowsScreen} options={{ title: 'Follows' }} />
      <Stack.Screen name="Requests" component={RequestsScreen} options={{ title: 'Requests' }} />
      <Stack.Screen name="Likes" component={LikesScreen} options={{ title: 'Likes' }} />
      <Stack.Screen
        name="ManageInvitations"
        component={ManageInvitationsScreen}
        options={{ title: 'Manage Invitations' }}
      />
      <Stack.Screen name="MyEvents" component={MyEventsScreen} options={{ title: 'My Events' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ title: 'Account Settings' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}
