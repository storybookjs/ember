/**
 * Interaction Testing Theme
 */

interface colors {
  pure?: {
    green?: string;
    red?: string;
    ochre?: string;
    blue?: string;
    lightBlue?: string;
    gray?: any;
  };
  calm?: {
    seafoam?: string;
  };
}

export const colors: colors = {
  pure: {
    green: '#66BF3C',
    red: '#FF4400',
    ochre: '#E69D00',
    blue: '#1EA7FD',
    lightBlue: 'rgba(30, 167, 253, 0.1)',
    gray: {
      300: '#EEEEEE',
      500: '#CCCCCC',
    },
  },
  calm: {
    seafoam: '#F6F9FC',
  },
};

export const theme = {
  colors,
};

export default theme;
