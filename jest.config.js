/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
    coverageProvider: 'v8',
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
};

module.exports = config;
