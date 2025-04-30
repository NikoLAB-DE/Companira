import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Helper function to get the initial theme
const getInitialTheme = (storageKey: string, defaultTheme: Theme): Theme => {
  try {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    // If no valid theme found or localStorage fails, save and return the default
    localStorage.setItem(storageKey, defaultTheme);
    return defaultTheme;
  } catch (e) {
    console.error("Failed to access localStorage for theme, using default.", e);
    return defaultTheme; // Fallback to default if localStorage access fails
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light', // Default to light theme
  storageKey = 'vite-ui-theme',
}) => {
  // Initialize state *without* applying class here
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme(storageKey, defaultTheme));

  // Use useEffect to apply the theme class on initial mount and whenever theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    // Clean up previous theme classes
    root.classList.remove('light', 'dark');
    // Add the current theme class
    root.classList.add(theme);
    // Update localStorage
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }
    // Log theme change for debugging
    // console.log(`Theme applied: ${theme}`);
  }, [theme, storageKey]); // Runs on initial mount and when theme changes

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // Log theme toggle attempt
      // console.log(`Toggling theme from ${prevTheme} to ${newTheme}`);
      return newTheme;
    });
  };

  const value = {
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
