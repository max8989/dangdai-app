// Re-export useAuth from AuthProvider for backward compatibility
// The auth state and methods are now centralized in the AuthProvider context
export { useAuth, type AuthError } from '../providers/AuthProvider'
