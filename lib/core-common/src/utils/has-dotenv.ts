import fs from 'fs';
import path from 'path';

// https://github.com/mrsteele/dotenv-webpack/blob/master/src/index.js#L34
const DOTENV_FILE = path.join('.', '.env');

/**
 * Is there a .env file in the current directory?
 * This is the default behavior of `dotenv-webpack-plugin`
 */
export const hasDotenv = () => fs.existsSync(DOTENV_FILE);
