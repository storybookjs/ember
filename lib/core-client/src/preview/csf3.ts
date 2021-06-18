import global from 'global';

const { PREVIEW_CSF_V3 } = global;
export const isCsf3Enabled = () => {
  try {
    return !!PREVIEW_CSF_V3;
  } catch (e) {
    return false;
  }
};
