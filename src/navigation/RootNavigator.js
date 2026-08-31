import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import DetailScreen from '../screens/DetailScreen';
import { useFavorites } from '../context/FavoritesContext';
import { HeaderDropShadow } from '../components/HeaderDropShadow';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerTintColor: colors.primary,
  headerTitleStyle: { fontWeight: '700', color: colors.text },
  contentStyle: { backgroundColor: colors.background },
  statusBarStyle: 'light',
  navigationBarColor: colors.safeBottom,
};

const detailScreenOptions = {
  title: '',
  headerTitleAlign: 'center',
  headerBackground: () => <HeaderBackground />,
};

function HeaderBackground() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ height: insets.top, backgroundColor: colors.primary }} />
    </View>
  );
}

function makeStack(rootName, RootScreen) {
  const Stack = createNativeStackNavigator();
  return function NestedStack() {
    return (
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name={rootName}
          component={RootScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={detailScreenOptions}
        />
      </Stack.Navigator>
    );
  };
}

const HomeStack = makeStack('Home', HomeScreen);
const FavoritesStack = makeStack('Favorites', FavoritesScreen);

function TabBar(props) {
  return (
    <View style={tabBarWrapStyles.wrap}>
      <BottomTabBar {...props} />
      <HeaderDropShadow edge="above" />
    </View>
  );
}

const tabBarWrapStyles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
});

function Tabs() {
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();
  const tabBarPadTop = 6;

  return (
    <Tab.Navigator
      tabBar={TabBar}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 49 + tabBarPadTop + insets.bottom,
          paddingTop: tabBarPadTop,
          paddingBottom: insets.bottom,
          elevation: 0,
          overflow: 'visible',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
          }),
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Pokédex',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="pokeball" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStack}
        options={{
          title: 'Favorites',
          tabBarBadge: favorites.length || undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'heart' : 'heart-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tabs />
    </NavigationContainer>
  );
}
