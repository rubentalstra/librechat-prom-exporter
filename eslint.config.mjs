/* eslint-disable no-unused-vars */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import tsParser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import globals from 'globals';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';

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
                typescript: {
                    project: ['./tsconfig.json'],
                },
                node: {
                    project: ['./tsconfig.json'],
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
            // Allow console statements
            'no-console': 'off',
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
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
];