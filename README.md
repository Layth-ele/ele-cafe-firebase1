# Ele Cafe Firebase Application

A React-based e-commerce application for a tea cafe with Firebase backend integration.

## Recent Code Fixes Applied

### Issues Fixed:
1. **Import/Export Mismatches**: Fixed mismatched function names in AuthContext.jsx
2. **Empty Firebase Configuration**: Added environment variable support and validation
3. **Aliased Import Paths**: Updated 40+ UI component files to use relative paths instead of aliases
4. **Syntax Error**: Fixed trailing comma in main.jsx

### Fixed Files:
- `src/context/AuthContext.jsx` - Fixed import names and variable conflicts
- `src/firebase/config.js` - Added environment variable support and validation
- `src/components/ui/*.jsx` - Fixed aliased imports (42 files)
- `src/main.jsx` - Fixed syntax error

## Setup Instructions

### 1. Firebase Configuration
Copy the example environment file and configure Firebase:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase project credentials. You can get these from:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings > General
4. In "Your apps" section, select your web app or create one
5. Copy the config values and paste them into `.env.local`

### 2. Install Dependencies
This appears to be a React application. You'll need to install dependencies based on your build tool:

For Vite:
```bash
npm install
# or
yarn install
```

For Create React App:
```bash
npm install
# or
yarn install
```

### 3. Start Development Server
```bash
npm run dev        # for Vite
# or
npm start          # for Create React App
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # UI component library (40+ components)
│   ├── admin/          # Admin-specific components
│   └── *.jsx           # Main application components
├── context/            # React context providers
│   ├── AuthContext.jsx # Authentication state management
│   ├── CartContext.jsx # Shopping cart state
│   ├── CreditContext.jsx # Credit system state
│   └── ThemeContext.jsx # Theme management
├── firebase/           # Firebase integration
│   ├── config.js       # Firebase configuration
│   ├── auth.js         # Authentication functions
│   ├── credits.js      # Credit system functions
│   ├── orders.js       # Order management
│   └── products.js     # Product data functions
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── services/           # External service integrations
└── App.jsx            # Main application component
```

## Features

- User authentication (email/password and Google OAuth)
- Shopping cart functionality
- Credit/referral system
- Admin dashboard
- Product catalog
- Order management
- Notification system (email/SMS simulation)
- Responsive UI with dark/light theme support

## Notes

- Firebase configuration is required for the app to function
- The notification system is currently in simulation mode for development
- All import/export issues have been resolved
- UI components use a consistent design system with Tailwind CSS