# Authentication System Documentation

## Overview

The credit risk dashboard implements a comprehensive JWT-based authentication system using React Context API. This documentation covers the authentication architecture, setup, and usage patterns.

## Architecture

### Components

1. **AuthContext** (`src/context/AuthContext.jsx`)
   - Central state management for authentication
   - Handles JWT token storage and refresh
   - Provides auth methods and user state
   - Persists auth state to localStorage

2. **useAuth Hook** (`src/hooks/useAuth.js`)
   - Simplifies access to AuthContext
   - Provides convenient API for auth operations
   - Error handling and validation

3. **useApi Hook** (`src/hooks/useApi.js`)
   - Authenticated API requests with automatic token injection
   - Automatic token refresh on 401 responses
   - Request timeout handling
   - Supports JSON and file uploads

4. **Auth Service** (`src/services/auth.js`)
   - Low-level authentication API calls
   - Used internally by AuthContext
   - Can be imported directly if needed

5. **ProtectedRoute** (`src/components/ProtectedRoute.jsx`)
   - Route wrapper for authentication enforcement
   - Role and permission checking
   - Redirects unauthorized users to login

## Setup

### 1. Environment Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

### 2. Wrap App with AuthProvider

Update `src/App.jsx`:

```jsx
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin only route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredRoles="admin">
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
```

## Usage Examples

### Login

```jsx
import { useAuth } from '../hooks/useAuth';

function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // User logged in successfully
    } catch (err) {
      console.error('Login failed:', err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Making Authenticated API Calls

```jsx
import { useApi } from '../hooks/useApi';

function ScoringComponent() {
  const { post } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    setLoading(true);
    try {
      const result = await post('/v1/score', {
        age: 35,
        income: 75000,
        // ... other fields
      });
      setData(result);
    } catch (error) {
      console.error('Scoring failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleScore} disabled={loading}>
        Score Application
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### Checking User Roles and Permissions

```jsx
import { useAuth } from '../hooks/useAuth';

function AdminPanel() {
  const { hasRole, hasPermission, user } = useAuth();

  if (!hasRole('admin')) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, {user?.name}</p>
      
      {hasPermission('manage_models') && (
        <button>Manage Models</button>
      )}
      
      {hasPermission('view_audit_log') && (
        <button>View Audit Log</button>
      )}
    </div>
  );
}
```

### Logout

```jsx
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Update Profile

```jsx
import { useAuth } from '../hooks/useAuth';

function ProfileSettings() {
  const { updateProfile, isLoading, user } = useAuth();
  const [formData, setFormData] = useState(user || {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProfile(formData);
      console.log('Profile updated:', updated);
    } catch (error) {
      console.error('Update failed:', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <button disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
```

### Password Reset

```jsx
import { useAuth } from '../hooks/useAuth';

function ForgotPasswordForm() {
  const { requestPasswordReset, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {sent ? (
        <p>Check your email for password reset instructions</p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
          <button disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </>
      )}
    </form>
  );
}
```

## Token Management

### How Tokens Are Handled

1. **Login**: User credentials are sent to `/v1/auth/login`
   - Server returns `access_token` and `refresh_token`
   - Tokens are stored in localStorage

2. **API Requests**: Token is automatically included in Authorization header
   - Format: `Authorization: Bearer <token>`

3. **Token Expiration**: When a request returns 401
   - `useApi` hook automatically calls `/v1/auth/refresh`
   - Retrieves new access token using refresh token
   - Retries original request with new token

4. **Logout**: 
   - Notifies backend at `/v1/auth/logout`
   - Clears tokens from localStorage
   - Clears auth state

### Token Refresh Flow

```
Request fails with 401
    ↓
Detect 401 error
    ↓
Call refreshAccessToken()
    ↓
Send refresh_token to /v1/auth/refresh
    ↓
Receive new access_token
    ↓
Retry original request
    ↓
Success or new error
```

## Backend API Endpoints

### Authentication Endpoints

- `POST /v1/auth/login` - User login
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - User logout
- `GET /v1/auth/profile` - Get current user profile
- `PUT /v1/auth/profile` - Update user profile
- `POST /v1/auth/password-reset` - Request password reset
- `POST /v1/auth/password-reset/confirm` - Confirm password reset
- `POST /v1/auth/change-password` - Change password
- `POST /v1/auth/2fa/enable` - Enable 2FA
- `POST /v1/auth/2fa/verify` - Verify 2FA code
- `POST /v1/auth/2fa/disable` - Disable 2FA
- `GET /v1/auth/sessions` - Get active sessions
- `DELETE /v1/auth/sessions/{id}` - Revoke session
- `DELETE /v1/auth/sessions` - Revoke all sessions

### Login Request

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login Response

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": ["user"],
    "permissions": ["score", "batch_process"]
  }
}
```

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **Secure Tokens**: 
   - Store tokens in localStorage (or sessionStorage for sensitive apps)
   - Consider using httpOnly cookies for tokens (requires backend support)
3. **Token Expiration**: 
   - Keep access tokens short-lived (15 minutes)
   - Use refresh tokens for longer persistence (7 days)
4. **CSRF Protection**: Enable CORS with specific origins
5. **Input Validation**: Validate all user inputs
6. **Rate Limiting**: Implement rate limiting on auth endpoints
7. **Account Lockout**: Lock accounts after failed attempts
8. **Audit Logging**: Log all authentication events

## Error Handling

### Common Error Scenarios

#### Invalid Credentials

```jsx
try {
  await login(email, password);
} catch (error) {
  // Handle "Invalid email or password"
  if (error.message.includes('Invalid')) {
    showErrorAlert('Email or password is incorrect');
  }
}
```

#### Expired Token

```jsx
// Automatically handled by useApi hook
// Original request is retried after token refresh
const result = await get('/v1/profile');
```

#### Session Expired

```jsx
// User is logged out and redirected to login
// This happens when refresh token is also expired
```

## Testing

### Mock Authentication for Testing

```jsx
// In test setup
const mockAuthContext = {
  user: { id: 1, email: 'test@example.com', roles: ['user'] },
  isAuthenticated: true,
  token: 'mock_token',
  login: jest.fn(),
  logout: jest.fn(),
};

// Wrap component with AuthContext.Provider
<AuthContext.Provider value={mockAuthContext}>
  <MyComponent />
</AuthContext.Provider>
```

### Testing Protected Routes

```jsx
test('should redirect to login when not authenticated', () => {
  const mockAuthContext = {
    isAuthenticated: false,
    isLoading: false,
  };

  render(
    <AuthContext.Provider value={mockAuthContext}>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthContext.Provider>
  );

  expect(screen.getByText(/login/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Issue: Token not being sent with requests

**Solution**: Ensure `useApi` hook is being used instead of direct fetch calls

```jsx
// ❌ Wrong
const result = await fetch('/api/endpoint');

// ✅ Correct
const { get } = useApi();
const result = await get('/api/endpoint');
```

### Issue: Infinite redirect loop between login and protected route

**Solution**: Check if token is being properly stored and restored

```jsx
// In browser DevTools > Application > Local Storage
// Should see: auth_token, auth_user, refresh_token
```

### Issue: 401 errors not triggering token refresh

**Solution**: Ensure AuthProvider wraps the entire app

```jsx
// ❌ Wrong
<LoginPage />
<AuthProvider>
  <App />
</AuthProvider>

// ✅ Correct
<AuthProvider>
  <App />
  <LoginPage />
</AuthProvider>
```

## Performance Optimization

1. **Memoize Auth Values**: AuthContext value is memoized to prevent unnecessary re-renders
2. **Lazy Load Pages**: Use React.lazy() for route components
3. **Token Refresh Background**: Token refresh happens silently without blocking UI
4. **Cache User Data**: User profile is cached in localStorage

## Migration from Old Auth System

If migrating from a different authentication system:

1. Update token storage keys to match AuthContext keys
2. Update API endpoints to match backend auth routes
3. Replace existing auth hooks with `useAuth` and `useApi`
4. Update login/logout redirects
5. Test all protected routes thoroughly

## Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [React Context API Documentation](https://react.dev/reference/react/useContext)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
