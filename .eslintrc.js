module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
    'functional'
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:functional/external-vanilla-recommended',
    'plugin:functional/recommended',
    'plugin:functional/stylistic',
    'prettier'
  ],
  rules: {
    // Functional programming rules
    'functional/no-class': 'error',
    'functional/no-this-expression': 'error',
    'functional/no-throw-statement': 'error',
    'functional/no-let': 'error',
    'functional/no-loop-statement': 'error',
    'functional/no-mutation': 'error',
    'functional/prefer-readonly-type': 'error',
    'functional/no-return-void': 'error',
    'functional/no-expression-statement': 'off', // Allow some expression statements
    'functional/functional-parameters': 'error',
    
    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-readonly-parameter-types': 'error',
    
    // General rules
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  env: {
    node: true,
    es2022: true
  }
};