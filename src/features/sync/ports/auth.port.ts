export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export type AuthStateChangeCallback = (user: User | null) => void;

export interface AuthPort {
  getCurrentUser(): Promise<User | null>;
  signInWithEmail(email: string, password?: string): Promise<{ user: User | null; error?: string }>;
  signUpWithEmail(email: string, password?: string): Promise<{ user: User | null; error?: string }>;
  signOut(): Promise<void>;
  onAuthStateChange(callback: AuthStateChangeCallback): () => void;
}
