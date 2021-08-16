import userEvent from '@testing-library/user-event';
import { instrument } from './instrument';

instrument({ userEvent }, { mutate: true, intercept: true });

export default userEvent;
