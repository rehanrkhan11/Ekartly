# Kartly — React Native storefront

A DummyJSON-powered shopping app built with Expo + React Navigation.
Every product category carries its own "weather" — the header gradient and
a falling-particle field (snow, sparkle, leaves, embers, glow, petals)
change the moment you switch tabs, and the active category renders as a
raised white pill that pokes into the content below, matching the
reference design.

## Features

- Animated splash screen that preloads categories + a featured product set
- Category navbar with a raised active pill (see `src/components/CategoryTabs.js`)
- Per-category theme: gradient header + particle field
- Live search (debounced) against `/products/search`
- Product detail bottom sheet
- Wishlist with its own tab + badge
- Cart with quantity steppers, totals, and a mock checkout
- Bottom tab navigation: Home / Categories / Wishlist / Cart / Account

## Run it

```bash
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR
code with Expo Go on your phone. `npm run web` also works.

## Project layout

```
App.js                        entry point, providers + navigation
src/
  api/api.js                  fetch helpers for dummyjson.com
  context/ShopContext.js      global state: products, cart, wishlist, search
  theme/categoryThemes.js     category -> color/particle theme mapping
  components/
    CategoryTabs.js           the raised "Beauty"-style navbar
    ParticleField.js          animated snow/sparkle/leaf/ember/glow/petal fx
    ProductCard.js
    ProductModal.js           product detail bottom sheet
    ScreenHeader.js           shared gradient header for non-home tabs
    Toast.js
  screens/
    SplashScreen.js
    HomeScreen.js
    CategoriesScreen.js
    WishlistScreen.js
    CartScreen.js
    AccountScreen.js
  navigation/
    RootNavigator.js
    BottomTabs.js
  utils/format.js             INR formatting (cosmetic USD -> INR)
```

## Notes

- Cart and wishlist live in memory (`ShopContext`) and reset on app reload.
  Swap in `AsyncStorage` or a backend if you need persistence.
- Prices come from DummyJSON in USD and are converted to INR at a fixed
  cosmetic rate purely for display — adjust `FX_RATE` in `src/utils/format.js`.
