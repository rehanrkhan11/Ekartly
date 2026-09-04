import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import your screen components
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import WishlistScreen from '../screens/WishlistScreen';
import CartScreen from '../screens/CartScreen';
import AccountScreen from '../screens/AccountScreen';

// Access app state/context for badges (e.g. cart items / wishlist count)
import { useShop } from '../context/ShopContext';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component matching your UI screenshots
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      {/* tabBarcontainer made the navigation container */}
      {state.routes.map((route, index) => {
        // This will loop through every tab
        const { options } = descriptors[route.key];
        // This gets configuration of each tab
        
        const isFocused = state.index === index;
        // states.routes tell contains the navigation pages like home categories wishlist cart account
        // state.index tells the on which tab uh are at present for example state.index=0 -> uh are at home state.index=3 -> means cart is selected
        // descriptors contains information about each tab
        
        const onPress = () => {
          // When a user press a tab 
          
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // isnot focused && navigation hasn't prevented the action

            navigation.navigate(route.name);
            // navigate to that screen 
          }
        };

        // Icon configuration based on route name 
        let iconName;
        let badgeCount = 0;

        if (route.name === 'Home') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Categories') {
          iconName = isFocused ? 'grid' : 'grid-large';
        } else if (route.name === 'Wishlist') {
          iconName = isFocused ? 'heart-multiple' : 'heart-multiple-outline';
        } else if (route.name === 'Cart') {
          iconName = isFocused ? 'cart' : 'cart-outline';
        } else if (route.name === 'Account') {
          iconName = isFocused ? 'account-circle' : 'account-circle-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            activeOpacity={0.8}
            style={styles.tabButton}
          >
            <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
              <MaterialCommunityIcons
                name={iconName}
                size={24}
                color={isFocused ? '#E58A00' : '#8E8E93'}
              />
              {/* only show the badge if the count is greater than 0 */}
              {options.tabBarBadge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {options.tabBarBadge > 99 ? '99+' : options.tabBarBadge}
                    {/* if badge is greate than 99 always show 99+ this prevents the badge from becoming huge */}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isFocused ? styles.activeLabel : styles.inactiveLabel]}>
              {route.name}
            </Text>
            {isFocused && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function BottomTabs() {
  const { cartItems, wishlistItems } = useShop();

  // you get the data becuase uh are using context here
  // here we are counting the element in the cart means cart count
  const cartCount = cartItems?.reduce((total, item) => total + item.quantity, 0) || 0;
  const wishlistCount = wishlistItems?.length || 0;

  return (
    <Tab.Navigator
      // ...props passing the all properties like props.state, props.navigator, props.descriptor
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen 
        name="Wishlist" 
        component={WishlistScreen} 
        options={{ tabBarBadge: wishlistCount }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ tabBarBadge: cartCount }}
      />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#111111', // Matches dark bottom nav bar theme
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    height: Platform.OS === 'ios' ? 85 : 68,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 20,
    position: 'relative',
  },
  /*activeIconWrapper: {
    backgroundColor: 'rgba(229, 138, 0, 0.15)', // Light highlight tint behind active tab
  },*/
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  activeLabel: {
    color: '#E58A00',
    fontWeight: '700',
  },
  inactiveLabel: {
    color: '#8E8E93',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E58A00',
    marginTop: 3,
    //''
  },
  badge: {
    position: 'absolute',
    right: -4,
    top: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});