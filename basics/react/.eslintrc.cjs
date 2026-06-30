module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh'],
    rules: {
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'off',
        // Curriculum files intentionally import APIs to document them
        '@typescript-eslint/no-unused-vars': 'warn',
        'no-unused-vars': 'warn',
        'no-empty': 'warn',
        'prefer-const': 'warn',
        '@typescript-eslint/ban-ts-comment': 'off',
    },
};
