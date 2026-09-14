'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Wallet,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/hooks/useHaptic';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Asosiy' },
  { href: '/feed', icon: BookOpen, label: 'Kundalik' },
  { href: '/tasks', icon: CheckSquare, label: 'Rejalar' },
  { href: '/finance', icon: Wallet, label: 'Moliya' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { select } = useHaptic();

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => select()}
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Icon
                  className="nav-icon"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </motion.div>
              <span className="nav-label">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
