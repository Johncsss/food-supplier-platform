# Food Supplier Platform

A monorepo containing both web and mobile applications for the Food Supplier platform.

## Project Structure

```
dev-FoodBuyer-2/
├── app/                    # Next.js web application
├── components/             # React components for web
├── lib/                    # Web-specific utilities
├── types/                  # Web-specific types
├── shared/                 # Shared code between web and mobile
│   ├── types.ts           # Shared TypeScript interfaces
│   ├── firebase.ts        # Shared Firebase configuration
│   └── package.json       # Shared package configuration
├── mobile-app/             # React Native mobile application
│   ├── src/
│   │   ├── screens/       # Mobile screen components
│   │   ├── hooks/         # Mobile-specific hooks
│   │   ├── services/      # Mobile services
│   │   └── types/         # Mobile type imports
│   └── package.json       # Mobile app dependencies
└── package.json           # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Install all dependencies:
   ```bash
   yarn install
   ```

### Running the Applications

#### Web Application (Next.js)
```bash
# Start the development server
yarn dev

# Or use the workspace script
yarn workspace food-supplier-platform dev
```

The web app will be available at `http://localhost:3001`

#### Mobile Application (React Native with Expo)
```bash
# Start the Expo development server
yarn mobile

# Or navigate to the mobile folder
cd mobile-app
yarn start
```

Then scan the QR code with Expo Go app on your mobile device.

### Available Scripts

- `yarn dev` - Start the web development server
- `yarn mobile` - Start the mobile development server
- `yarn mobile:android` - Start Android emulator
- `yarn mobile:ios` - Start iOS simulator
- `yarn build` - Build the web application
- `yarn lint` - Run ESLint on the web application

## Shared Code

The `shared/` folder contains code that is used by both web and mobile applications:

- **Types**: Common TypeScript interfaces (`User`, `Product`, `Order`, etc.)
- **Firebase**: Shared Firebase configuration and utilities

### Adding New Shared Code

1. Add your code to the `shared/` folder
2. Export it from `shared/index.ts`
3. Import it in both web and mobile applications

## Development Workflow

1. **Web Development**: Work in the `app/` folder for Next.js components and pages
2. **Mobile Development**: Work in the `mobile-app/src/` folder for React Native screens and components
3. **Shared Logic**: Add common business logic, types, and utilities to the `shared/` folder

## Technologies Used

### Web Stack
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Firebase (Firestore, Auth)
- Stripe

### Mobile Stack
- React Native
- Expo
- TypeScript
- Firebase (Firestore, Auth)
- React Navigation

## Firebase Configuration

Both applications use the same Firebase project. The configuration is shared in `shared/firebase.ts`.

## Notes

- The mobile app uses Expo Go for development
- Both apps share the same Firebase database
- Types are shared between web and mobile for consistency
- The web app runs on port 3001 by default 