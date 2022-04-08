const QUOTE_REGEX = /^['"]|['"]$/g;
export const trimQuotes = (str: string) => str.replace(QUOTE_REGEX, '');
export const includesQuotes = (str: string) => QUOTE_REGEX.test(str);
