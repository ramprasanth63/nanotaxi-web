# AGENTS.md - NanoTaxi Development Guide

## Build & Run Commands

```bash
npm install                   # Install dependencies
npm run dev                   # Start Expo dev server
npm run android              # Build and run on Android
npm run ios                  # Build and run on iOS
npm run web                  # Run web version
npm run lint                 # Run ESLint (no test runner configured)
```

## Architecture & Structure

**Framework**: React Native (Expo 53) + TypeScript, file-based routing via Expo Router

**Key Directories**:
- `app/` - Route-based pages (Expo Router) with `_layout.tsx` root, `auth/`, `(tabs)/`, `booking/`, `tracking/`
- `components/` - Reusable React components (ThemedText, ThemedView, AuthPopup, InvoiceGenerator, etc.)
- `contexts/` - State management: `AuthContext` (user login/auth), `BookingContext` (booking state)
- `hooks/` - Custom React hooks (`useThemeColor`, `useFrameworkReady`, etc.)
- `services/` - API integration (`apiClient.ts` with axios, `Distance.ts`)
- `types/` - TypeScript type definitions (index.ts)
- `constants/` - App constants
- `assets/` - Images, icons, fonts

**Core Providers**: AuthProvider, BookingProvider wrap the Stack navigation

## Code Style & Conventions

**TypeScript**: Strict mode enabled. Import paths use `@/` alias (resolves to root).

**Components**: Functional components with TypeScript. Export types alongside: `export type ComponentProps = ...`

**React Native Styling**: Use `StyleSheet.create()` for styles. Components accept `style` prop for composition. Theme colors via `useThemeColor()` hook.

**Imports**: Named exports preferred. Absolute imports with `@/` alias. No bare relative paths in components.

**Naming**: PascalCase for components/types, camelCase for functions/files. Context values end with `Context` or `Provider`.

**Error Handling**: Try-catch in async functions, state-based error messages in UI. AsyncStorage operations wrapped.

**Key Dependencies**: expo-router (navigation), React 19, React Native 0.79.6, axios (HTTP), react-native-maps, expo-location
