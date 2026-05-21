import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// On Expo Web, hide the browser-native password reveal button (Edge ::-ms-reveal,
// Chrome credentials auto-fill icon, Safari) so it does not overlap our custom eye.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `
    input[type="password"]::-ms-reveal,
    input[type="password"]::-ms-clear { display: none !important; }
    input[type="password"]::-webkit-credentials-auto-fill-button,
    input[type="password"]::-webkit-contacts-auto-fill-button { display: none !important; }
  `;
  document.head.appendChild(s);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
