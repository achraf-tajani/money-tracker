/**
 * Application constants
 */

// Color palette
export const COLORS = {
  primary: {
    50: '#F5F3FF',
    500: '#8B5CF6',
    600: '#7C3AED',
    900: '#4C1D95',
  },
  success: {
    500: '#10B981',
  },
  warning: {
    500: '#F59E0B',
  },
  danger: {
    500: '#EF4444',
  },
  dark: {
    bg: '#0F172A',
    card: '#1E293B',
  },
  light: {
    bg: '#F8FAFC',
    card: '#FFFFFF',
  },
} as const;

// Default categories with icons and colors
export const DEFAULT_CATEGORIES = [
  { nom: 'Loyer', icon: 'Home', couleur: '#EF4444', type: 'charge' },
  { nom: 'Assurance', icon: 'Shield', couleur: '#F59E0B', type: 'charge' },
  { nom: 'Factures', icon: 'FileText', couleur: '#3B82F6', type: 'charge' },
  { nom: 'Courses', icon: 'ShoppingCart', couleur: '#10B981', type: 'depense' },
  { nom: 'Transport', icon: 'Car', couleur: '#6366F1', type: 'depense' },
  { nom: 'Loisirs', icon: 'Gamepad2', couleur: '#8B5CF6', type: 'depense' },
  { nom: 'Santé', icon: 'Heart', couleur: '#EC4899', type: 'depense' },
  { nom: 'Restaurant', icon: 'UtensilsCrossed', couleur: '#F59E0B', type: 'depense' },
  { nom: 'Vêtements', icon: 'Shirt', couleur: '#14B8A6', type: 'depense' },
  { nom: 'Divers', icon: 'MoreHorizontal', couleur: '#64748B', type: 'depense' },
] as const;

// Animation variants for Framer Motion
export const ANIMATION_VARIANTS = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2 },
  },
} as const;

// Responsive breakpoints (matches Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
