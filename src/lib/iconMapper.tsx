import {
  Home,
  Shield,
  FileText,
  Wifi,
  ShoppingCart,
  Car,
  Gamepad2,
  Heart,
  UtensilsCrossed,
  Shirt,
  MoreHorizontal,
  Wallet,
  TrendingDown,
  Circle,
} from 'lucide-react';

/**
 * Map icon names to Lucide React components
 */
export const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  Shield,
  FileText,
  Wifi,
  ShoppingCart,
  Car,
  Gamepad2,
  Heart,
  UtensilsCrossed,
  Shirt,
  MoreHorizontal,
  Wallet,
  TrendingDown,
  Circle, // Default fallback icon
};

/**
 * Get icon component by name
 */
export function getIconComponent(iconName: string) {
  return iconMap[iconName] || Circle;
}

/**
 * Get emoji representation of icon (for select options where we can't render components)
 */
export function getIconEmoji(iconName: string): string {
  const emojiMap: Record<string, string> = {
    Home: '🏠',
    Shield: '🛡️',
    FileText: '📄',
    Wifi: '📶',
    ShoppingCart: '🛒',
    Car: '🚗',
    Gamepad2: '🎮',
    Heart: '❤️',
    UtensilsCrossed: '🍽️',
    Shirt: '👕',
    MoreHorizontal: '📌',
    Wallet: '💰',
    TrendingDown: '📉',
  };

  return emojiMap[iconName] || '⭐';
}
