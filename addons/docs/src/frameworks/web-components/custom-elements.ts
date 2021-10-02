import { getCustomElements, isValidComponent, isValidMetaData } from '@storybook/web-components';
import { ArgType, ArgTypes } from '@storybook/api';
import { logger } from '@storybook/client-logger';

interface TagItem {
  name: string;
  type: { [key: string]: any };
  description: string;
  default?: any;
  kind?: string;
  defaultValue?: any;
}

interface Tag {
  name: string;
  description: string;
  attributes?: TagItem[];
  properties?: TagItem[];
  events?: TagItem[];
  methods?: TagItem[];
  members?: TagItem[];
  slots?: TagItem[];
  cssProperties?: TagItem[];
  cssParts?: TagItem[];
}

interface CustomElements {
  tags: Tag[];
  modules?: [];
}

interface Module {
  declarations?: [];
  exports?: [];
}

interface Declaration {
  tagName: string;
}
interface Sections {
  attributes?: any;
  properties?: any;
  events?: any;
  slots?: any;
  cssCustomProperties?: any;
  cssShadowParts?: any;
}

function mapData(data: TagItem[], category: string) {
  return (
    data &&
    data
      .filter((item) => item && item.name)
      .reduce((acc, item) => {
        if (item.kind === 'method') return acc;

        switch (category) {
          case 'events':
            mapEvent(item).forEach((argType) => {
              acc[argType.name] = argType;
            });
            break;
          default:
            acc[item.name] = mapItem(item, category);
            break;
        }

        return acc;
      }, {} as ArgTypes)
  );
}

function mapItem(item: TagItem, category: string): ArgType {
  const type =
    category === 'properties' ? { name: item.type?.text || item.type } : { name: 'void' };

  return {
    name: item.name,
    required: false,
    description: item.description,
    type,
    table: {
      category,
      type: { summary: item.type?.text || item.type },
      defaultValue: {
        summary: item.default !== undefined ? item.default : item.defaultValue,
      },
    },
  };
}

function mapEvent(item: TagItem): ArgType[] {
  let name = item.name
    .replace(/(-|_|:|\.|\s)+(.)?/g, (_match, _separator, chr: string) => {
      return chr ? chr.toUpperCase() : '';
    })
    .replace(/^([A-Z])/, (match) => match.toLowerCase());

  name = `on${name.charAt(0).toUpperCase() + name.substr(1)}`;

  return [{ name, action: { name: item.name }, table: { disable: true } }, mapItem(item, 'events')];
}

const getMetaDataExperimental = (tagName: string, customElements: CustomElements) => {
  if (!isValidComponent(tagName) || !isValidMetaData(customElements)) {
    return null;
  }
  const metaData = customElements.tags.find(
    (tag) => tag.name.toUpperCase() === tagName.toUpperCase()
  );
  if (!metaData) {
    logger.warn(`Component not found in custom-elements.json: ${tagName}`);
  }
  return metaData;
};

const getMetaDataV1 = (tagName: string, customElements: CustomElements) => {
  if (!isValidComponent(tagName) || !isValidMetaData(customElements)) {
    return null;
  }

  let metadata;
  customElements?.modules?.forEach((_module: Module) => {
    _module?.declarations?.forEach((declaration: Declaration) => {
      if (declaration.tagName === tagName) {
        metadata = declaration;
      }
    });
  });

  if (!metadata) {
    logger.warn(`Component not found in custom-elements.json: ${tagName}`);
  }
  return metadata;
};

export const extractArgTypesFromElements = (tagName: string, customElements: CustomElements) => {
  const metaData = getMetaData(tagName, customElements);
  return (
    metaData && {
      ...mapData(metaData.attributes, 'attributes'),
      ...mapData(metaData.members, 'properties'),
      ...mapData(metaData.properties, 'properties'),
      ...mapData(metaData.events, 'events'),
      ...mapData(metaData.slots, 'slots'),
      ...mapData(metaData.cssProperties, 'css custom properties'),
      ...mapData(metaData.cssParts, 'css shadow parts'),
    }
  );
};

const getMetaData = (tagName: string, manifest: any) => {
  if (manifest?.version === 'experimental') {
    return getMetaDataExperimental(tagName, manifest);
  }
  return getMetaDataV1(tagName, manifest);
};

export const extractArgTypes = (tagName: string) => {
  const cem = getCustomElements();
  return extractArgTypesFromElements(tagName, cem);
};

export const extractComponentDescription = (tagName: string) => {
  const metaData = getMetaData(tagName, getCustomElements());
  return metaData && metaData.description;
};
