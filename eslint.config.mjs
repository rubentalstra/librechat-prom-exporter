/* eslint-disable no-unused-vars */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        files: ['eslint.config.mjs'],
        languageOptions: {
            parserOptions: {},
        },
    },
    {
        ignores: ['node_modules/**/*', 'dist/**/*'],
    },
    ...fixupConfigRules(compat.extends('eslint:recommended')),
    {
        plugins: {
            '@typescript-eslint': fixupPluginRules(typescriptEslintPlugin),
            import: importPlugin,
            jest: fixupPluginRules(jest),
        },
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.commonjs,
            },
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        settings: {
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts'],
            },
            'import/resolver': {
                node: {
                    extensions: ['.ts', '.js'],
                },
            },
        },
        rules: {
            'max-len': [
                'error',
                {
                    code: 120,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                    ignoreComments: true,
                },
            ],
            curly: ['error', 'all'],
            semi: ['error', 'always'],
            'object-curly-spacing': ['error', 'always'],
            'no-multiple-empty-lines': ['error', { max: 1 }],
            'no-trailing-spaces': 'error',
            'comma-dangle': ['error', 'always-multiline'],
            'no-console': 'error',
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
        },
    },
    ...compat
        .extends(
            'plugin:@typescript-eslint/eslint-recommended',
            'plugin:@typescript-eslint/recommended',
        )
        .map((config) => {
            const { plugins, ...rest } = config;
            return { ...rest, files: ['**/*.ts'] }; // note the trailing comma here
        }),
    {
        files: ['**/*.ts'],
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'import/order': 'off',
        },
    },
];