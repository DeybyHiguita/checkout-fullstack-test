/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.(test|spec).(ts|tsx)'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpe?g|gif|svg|webp|avif)$': '<rootDir>/test/fileMock.cjs',
    'base-url$': '<rootDir>/test/baseUrlMock.ts',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', { configFile: './babel.config.jest.cjs' }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/app/store.ts',
    '!src/app/App.tsx',
    '!src/shared/api/base-url.ts',
    '!src/shared/types.ts',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
