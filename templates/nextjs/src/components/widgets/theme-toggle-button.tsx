'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const iconVariants = {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 50, opacity: 0 },
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative overflow-hidden rounded-full bg-gray-200 p-5 transition-colors duration-100 dark:bg-gray-800 dark:text-gray-200"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.span
            key="moon"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 1000,
              damping: 15,
              mass: 0.3,
            }}
            className="flex-center absolute inset-0"
          >
            <Sun className="h-5 w-5" fill="currentColor" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 1000,
              damping: 15,
              mass: 0.3,
            }}
            className="flex-center absolute inset-0"
          >
            <Moon className="h-5 w-5" fill="currentColor" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
