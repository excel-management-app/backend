module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'sonarjs'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:sonarjs/recommended',
    ],
    env: {
        node: true,
    },
    rules: {
        'no-restricted-imports': [
            'error',
            {
                paths: [
                    {
                        name: '@sentry/node',
                        message:
                            'Import from our `errors` wrapper module instead.',
                    },
                ],
            },
        ],
    },
    overrides: [
        {
            files: ['**/*.ts?(x)'],
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: __dirname,
            },
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended',
                'plugin:@typescript-eslint/recommended-requiring-type-checking',
                'prettier',
            ],
            rules: {
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/no-shadow': 'warn',
                '@typescript-eslint/no-unsafe-argument': 'warn',
                '@typescript-eslint/no-unsafe-assignment': 'warn',
                '@typescript-eslint/no-unsafe-call': 'warn',
                '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
                '@typescript-eslint/no-unsafe-member-access': 'warn',
                '@typescript-eslint/no-unsafe-return': 'warn',
                '@typescript-eslint/no-unused-vars': [
                    'warn',
                    {
                        args: 'all',
                        argsIgnorePattern: '^_',
                        caughtErrors: 'all',
                        caughtErrorsIgnorePattern: '^e$|^err$|^error$',
                        destructuredArrayIgnorePattern: '^_',
                        varsIgnorePattern: '^_|^[A-Z_]+$', // ignore consts and _ prefixed vars
                        ignoreRestSiblings: true,
                    },
                ],
                'sonarjs/no-duplicate-string': 'off',
                curly: 'error',
            },
        },
        {
            files: ['**/__tests__/**/*.[jt]s', '**/?(*.)+(test).[jt]s'],
            rules: {
                '@typescript-eslint/unbound-method': 'off',
            },
        },
    ],
};
