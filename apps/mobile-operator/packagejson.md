Lo que está mal: Tienes scripts de Expo (expo start, expo start --android) y dependencias puras de React Native (expo, react-native, react-native-maps).

Por qué es un problema: Tu proyecto está diseñado para usar Vite como empaquetador (lo confirma tu archivo vite.config.ts). Si ejecutas pnpm dev, Vite no sabrá qué hacer con las dependencias de Expo, y las etiquetas HTML normales de React (<div>) fallarán en React Native.

Solución: Hay que migrar este archivo a una estructura web/Capacitor estándar eliminando el rastro de Expo.


Package deberia ser:

{
  "name": "@monagas/mobile-operator",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext .ts,.tsx",
    "preview": "vite preview"
  },
  "dependencies": {
    "@capacitor/android": "^6.0.0",
    "@capacitor/core": "^6.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/node": "^20.11.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.4.5",
    "vite": "^5.2.0"
  }
}