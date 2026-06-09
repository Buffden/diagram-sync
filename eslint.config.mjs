import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['dist/**', 'coverage/**'],
	},
	...tseslint.configs.recommended,
	{
		files: ['src/**/*.ts'],
		rules: {
			// Enforce tab indentation
			'indent': ['error', 'tab', { SwitchCase: 1 }],

			// Always use === and !==
			'eqeqeq': ['error', 'always'],

			// No var — use const/let
			'no-var': 'error',

			// Use const when value is never reassigned
			'prefer-const': 'error',

			// No duplicate import declarations for the same module
			'no-duplicate-imports': 'error',

			// CLI tool — console is intentional
			'no-console': 'off',

			// Catch unused variables; allow _ prefix to opt out
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			}],

			// Flag any — warn in source, off in tests (see override below)
			'@typescript-eslint/no-explicit-any': 'warn',

			// Enforce import type for type-only imports
			'@typescript-eslint/consistent-type-imports': ['error', {
				prefer: 'type-imports',
				fixStyle: 'inline-type-imports',
			}],

			// Flag non-null assertions (!) — prefer explicit checks
			'@typescript-eslint/no-non-null-assertion': 'warn',

			// No require() — use import
			'@typescript-eslint/no-require-imports': 'error',
		},
	},
	{
		// Tests use `as any` heavily for mock typing — that's fine
		files: ['src/__tests__/**/*.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
);
