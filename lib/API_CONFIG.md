# API Configuration

This file contains centralized API endpoint configuration for the feedback application.

## Usage

Import the API endpoints and helper functions from `lib/api-config.ts`:

```typescript
import { API_ENDPOINTS, apiRequest, buildApiUrl } from '@/lib/api-config'
```

## Available Endpoints

- `API_ENDPOINTS.DEPARTMENTS` - Get department configuration
- `API_ENDPOINTS.FEEDBACK` - Submit and retrieve feedback data
- `API_ENDPOINTS.CHECK_SUBMISSIONS` - Check existing submissions for a purse number
- `API_ENDPOINTS.INIT_DB` - Initialize the database

## Helper Functions

### `apiRequest(url, options)`
Makes API requests with common headers and configuration.

```typescript
const response = await apiRequest(API_ENDPOINTS.FEEDBACK, {
  method: 'POST',
  body: JSON.stringify(data)
})
```

### `buildApiUrl(endpoint, params)`
Builds URLs with query parameters.

```typescript
const url = buildApiUrl(API_ENDPOINTS.CHECK_SUBMISSIONS, { 
  purseNumber: '12345' 
})
// Results in: /api/check-submissions?purseNumber=12345
```

## Environment Variables

Set `NEXT_PUBLIC_API_BASE_URL` to configure the API base URL for different environments:

- Development: Leave empty (defaults to current origin)
- Production: Set to your production API URL

## Benefits

1. **Centralized Management**: All API URLs in one place
2. **Environment Support**: Easy switching between dev/prod
3. **Type Safety**: TypeScript support with const assertions
4. **Consistency**: Standardized headers and request handling
5. **Maintainability**: Easy to update URLs across the entire application
