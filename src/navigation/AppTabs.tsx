import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { SmartCityAgentScreen } from '../screens/SmartCityAgentScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

export function AppTabs() {
  const { role } = useAuthStore();

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 22,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.text3,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 1 },
        tabBarIcon: ({ color }) => {
          const icons: Record<string, string> = {
            'Submitted Incidents': '⚡',
            Report: '📋',
            Nexy: '✨',
            Map: '🗺️',
            Profile: '👤',
          };
          return <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      {role === 'agent' && (
        <Tab.Screen name="Submitted Incidents" component={DashboardScreen} />
      )}
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Nexy" component={SmartCityAgentScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}