// Example usage of the development logger
import { devLogger, logApiCall, logComponentRender, logStateChange, logUserAction, startDebuggingSession, endDebuggingSession } from './logger';

// Example debugging session
export const exampleDebuggingSession = async () => {
  startDebuggingSession('Authentication Flow Issue');
  
  try {
    // Log user action
    logUserAction('Attempted login', { email: 'user@example.com' });
    
    // Log API call
    logApiCall('/api/auth/login', 'POST', { email: 'user@example.com', password: '[REDACTED]' });
    
    // Log component render
    logComponentRender('LoginForm', { isLoading: false, error: null });
    
    // Log state changes
    logStateChange('isAuthenticated', false, true, 'AuthProvider');
    
    // Log error if something goes wrong
    devLogger.logErrorTrace('Authentication failed', {
      error: 'Invalid credentials',
      statusCode: 401,
      timestamp: new Date().toISOString()
    }, 'AUTH');
    
    // Log fix attempt
    devLogger.logFixAttempt(1, 'Updated password validation logic', {
      file: 'src/components/auth/SignInForm.tsx',
      changes: ['Added password strength validation', 'Fixed regex pattern']
    }, 'AUTH');
    
    endDebuggingSession('Authentication Flow Issue', 'RESOLVED');
    
  } catch (error) {
    devLogger.logErrorTrace('Debugging session failed', error, 'SESSION');
    endDebuggingSession('Authentication Flow Issue', 'FAILED');
  }
};

// Usage in components
export const debugComponentIssue = () => {
  devLogger.debug('Component debugging started', {}, 'COMPONENT');
  
  // Log inputs
  devLogger.logInput('Component props', { userId: '123', isVisible: true }, 'COMPONENT');
  
  // Log outputs
  devLogger.logOutput('Component render result', { success: true, elementsRendered: 5 }, 'COMPONENT');
  
  // Search recent logs
  const recentLogs = devLogger.readRecentLogs(20);
  console.log('Recent logs:', recentLogs);
  
  // Search for specific errors
  const errorLogs = devLogger.searchLogs('error', 3);
  console.log('Recent errors:', errorLogs);
};