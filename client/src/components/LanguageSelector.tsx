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

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-white/70" />
      <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
        <SelectTrigger className="w-32 border-white/30 bg-white/20 text-white">
          <SelectValue />
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
