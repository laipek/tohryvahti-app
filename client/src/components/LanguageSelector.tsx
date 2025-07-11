import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'fi', name: '🇫🇮 Suomi' },
    { code: 'sv', name: '🇸🇪 Svenska' },
    { code: 'en', name: '🇬🇧 English' }
  ];

  const getFlag = (langCode: string) => {
    switch (langCode) {
      case 'fi': return '🇫🇮';
      case 'sv': return '🇸🇪';
      case 'en': return '🇬🇧';
      default: return '🇫🇮';
    }
  };

  const getLanguageName = (langCode: string) => {
    switch (langCode) {
      case 'fi': return 'Suomi';
      case 'sv': return 'Svenska';
      case 'en': return 'English';
      default: return 'Suomi';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-municipal-gray hidden sm:block" />
      <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
        <SelectTrigger className="w-16 sm:w-32 border-municipal-border">
          <SelectValue>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getFlag(i18n.language)}</span>
              <span className="text-sm hidden sm:inline">{getLanguageName(i18n.language)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
