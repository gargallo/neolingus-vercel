# Demo Mode for Neolingus

Demo mode allows you to test the Neolingus app functionality without setting up authentication or Supabase.

## How to Enable Demo Mode

### Method 1: Environment Variable (Recommended for development)

1. Add to your `.env.local` file:
```bash
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```

2. Start the development server:
```bash
npm run dev
```

3. Visit any protected route directly, such as:
   - http://localhost:3000/dashboard/valenciano/c1
   - http://localhost:3000/dashboard
   - http://localhost:3000/admin

### Method 2: URL Parameter (Temporary)

Add `?demo=true` to any URL:
- http://localhost:3000/dashboard/valenciano/c1?demo=true
- http://localhost:3000/dashboard?demo=true

### Method 3: Browser Storage (Persistent)

1. Open browser developer tools (F12)
2. Go to Console tab
3. Run: `localStorage.setItem('demo_mode', 'true')`
4. Reload the page

## What Demo Mode Does

- **Bypasses Authentication**: All protected routes (`/dashboard`, `/admin`, `/protected`) become accessible without login
- **Shows Demo Banner**: A yellow banner appears at the top indicating demo mode is active
- **Uses Mock Data**: The app will use predetermined mock data instead of fetching from Supabase
- **Preserves Functionality**: All UI components and interactions work as intended

## Demo Routes to Test

### Main Academia Dashboard
- http://localhost:3000/dashboard

### Valenciano C1 Course (Fully Featured)
- http://localhost:3000/dashboard/valenciano/c1
- Features complete mock data for JQCV Valenciano C1 course
- Shows progress analytics, course dashboard, and all components

### Exam Simulators
- http://localhost:3000/dashboard/valenciano/c1/examens/jqcv
- http://localhost:3000/dashboard/valenciano/c1/examens/eoi

### Admin Panel (if implemented)
- http://localhost:3000/admin

## Disabling Demo Mode

### Via Browser (if using localStorage)
Click "Exit Demo" button in the demo banner, or run in console:
```javascript
localStorage.removeItem('demo_mode')
```

### Via Environment
Remove or set to false in `.env.local`:
```bash
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

## Security Notes

- **⚠️ Never use demo mode in production**
- Demo mode completely bypasses all authentication
- Only enable in development/testing environments
- The demo banner clearly indicates when demo mode is active

## Troubleshooting

If demo mode isn't working:

1. Check that environment variables are set correctly
2. Restart the development server after changing `.env.local`
3. Clear browser cache and cookies
4. Check browser console for any error messages

## Mock Data

The app includes comprehensive mock data for:
- User progress and analytics
- Course information
- Exam results and statistics
- Learning recommendations
- Progress tracking

This allows you to see the full functionality without a backend setup.