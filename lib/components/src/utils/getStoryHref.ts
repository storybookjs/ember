import qs from 'qs';

export const getStoryHref = (
  baseUrl: string,
  storyId: string,
  additionalParams: Record<string, string> = {}
) => {
  const [url, paramsStr] = baseUrl.split('?');
  const params = paramsStr
    ? {
        ...qs.parse(paramsStr),
        ...additionalParams,
        id: storyId,
      }
    : {
        ...additionalParams,
        id: storyId,
      };
  return `${url}${qs.stringify(params, { addQueryPrefix: true, encode: false })}`;
};
