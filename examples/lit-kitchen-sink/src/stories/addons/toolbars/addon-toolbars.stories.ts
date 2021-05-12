import { html } from 'lit';

export default {
  title: 'Addons / Toolbars',
};

const getCaptionForLocale = (locale: string) => {
  switch (locale) {
    case 'es':
      return 'Hola!';
    case 'fr':
      return 'Bonjour !';
    case 'zh':
      return '你好!';
    case 'kr':
      return '안녕하세요!';
    case 'en':
    default:
      return 'Hello';
  }
};

export const Locale = (args: unknown, { globals: { locale } }: { globals: { locale: string } }) => {
  return html` <div>Your locale is '${locale}', so I say: ${getCaptionForLocale(locale)}</div> `;
};
