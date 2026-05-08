'use client';

import { useLanguage, useLanguageHydrated } from '@/hooks/use-language';
import { LANGUAGES, Language } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon';
  showLabel?: boolean;
}

export function LanguageSwitcher({ 
  variant = 'default', 
  showLabel = true 
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  const isHydrated = useLanguageHydrated();

  const currentLang = LANGUAGES[language];

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
        disabled
      >
        <i className="bi bi-globe text-sm"></i>
      </Button>
    );
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            <motion.span
              key={language}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-base"
            >
              {currentLang.flag}
            </motion.span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {t('switchLanguage')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(LANGUAGES).map(([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code as Language)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <span className="text-lg">{info.flag}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{info.nativeName}</p>
                <p className="text-xs text-muted-foreground">{info.name}</p>
              </div>
              {language === code && (
                <i className="bi bi-check-lg text-green-600 text-sm"></i>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 sm:h-9 sm:px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 gap-1.5"
          >
            <motion.span
              key={language}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-sm"
            >
              {currentLang.flag}
            </motion.span>
            {showLabel && (
              <span className="text-xs font-medium hidden sm:inline">
                {currentLang.nativeName}
              </span>
            )}
            <i className="bi bi-chevron-down text-xs opacity-50"></i>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(LANGUAGES).map(([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code as Language)}
              className={`flex items-center gap-3 cursor-pointer ${
                language === code ? 'bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              <span className="text-lg">{info.flag}</span>
              <span className="flex-1 text-sm">{info.nativeName}</span>
              {language === code && (
                <i className="bi bi-check-lg text-green-600 text-sm"></i>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant - beautiful pill-style button
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 sm:h-9 px-2 sm:px-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 border border-transparent hover:border-green-200 dark:hover:border-green-800 rounded-lg transition-all duration-300 group"
        >
          <i className="bi bi-globe text-sm text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors mr-1.5"></i>
          <motion.div
            key={language}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            <span className="text-sm">{currentLang.flag}</span>
            {showLabel && (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                {currentLang.nativeName}
              </span>
            )}
          </motion.div>
          <i className="bi bi-chevron-down text-xs text-gray-400 group-hover:text-green-500 transition-colors ml-0.5"></i>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-52 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl"
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-0">
          {t('switchLanguage')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <div className="space-y-0.5">
          {Object.entries(LANGUAGES).map(([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code as Language)}
              className={`rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-200 ${
                language === code 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={code}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 w-full"
                >
                  <span className="text-xl">{info.flag}</span>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${language === code ? 'text-green-700 dark:text-green-300' : ''}`}>
                      {info.nativeName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {info.name}
                    </p>
                  </div>
                  {language === code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <i className="bi bi-check-lg text-green-600 dark:text-green-400 text-sm"></i>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
