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
        // Files/folders to ignore.
        ignores: ['node_modules/**/*', 'dist/**/*'],
    },
    // Extend from eslint:recommended.
    ...fixupConfigRules(
        compat.extends('eslint:recommended')
    ),
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
            parserOptions: {
                project: './tsconfig.json',
            },
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
            '@typescript-eslint/ban-ts-comment': [
                'error',
                { 'ts-ignore': false }
            ],
            'no-nested-ternary': 'warn',
            'no-constant-binary-expression': 'warn',
            'no-unused-vars': 'warn',
            indent: ['error', 2, { SwitchCase: 1 }],
            'max-len': [
                'error',
                {
                    code: 120,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                    ignoreComments: true,
                },
            ],
            'linebreak-style': 0,
            curly: ['error', 'all'],
            semi: ['error', 'always'],
            'object-curly-spacing': ['error', 'always'],
            'no-multiple-empty-lines': ['error', { max: 1 }],
            'no-trailing-spaces': 'error',
            'comma-dangle': ['error', 'always-multiline'],
            'no-console': 'off',
            'import/no-cycle': 'error',
            'import/no-self-import': 'error',
            'import/extensions': 'off',
            'no-promise-executor-return': 'off',
            'no-param-reassign': 'off',
            'no-continue': 'off',
            'no-restricted-syntax': 'off',
            quotes: ['error', 'single'],
            'key-spacing': ['error', { beforeColon: false, afterColon: true }],
        },
    },
    {
        files: ['**/*.ts'],
        ignores: ['dist/**/*'],
        plugins: {
            '@typescript-eslint': fixupPluginRules(typescriptEslintPlugin),
            jest: fixupPluginRules(jest),
        },
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            'no-constant-binary-expression': 'off',
            'no-nested-ternary': 'off',
        },
    },
    ...compat
        .extends(
            'plugin:@typescript-eslint/eslint-recommended',
            'plugin:@typescript-eslint/recommended'
        )
        .map((config) => ({
            ...config,
            files: ['**/*.ts'],
        })),
];