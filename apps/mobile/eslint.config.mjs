// https://docs.expo.dev/guides/using-eslint/
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('expo'),
  {
    ignores: ['node_modules/', '.expo/', 'dist/'],
    rules: {
      // These rules are from eslint-plugin-react-hooks v7 (React Compiler).
      // eslint-config-expo was designed for v4 — disable until Expo supports React Compiler.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
