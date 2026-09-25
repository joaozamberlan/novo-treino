import { apiBaseUrl } from './base-url';

describe('apiBaseUrl', () => {
  const original = process.env.BACKEND_URL;
  afterEach(() => {
    process.env.BACKEND_URL = original;
  });

  it.each([
    ['api.exemplo.app', 'https://api.exemplo.app'],
    ['https://api.exemplo.app/', 'https://api.exemplo.app'],
    ['http://localhost:3000', 'http://localhost:3000'],
    ['  api.exemplo.app//  ', 'https://api.exemplo.app'],
  ])('%s → %s', (entrada, esperado) => {
    process.env.BACKEND_URL = entrada;
    expect(apiBaseUrl()).toBe(esperado);
  });

  it('usa localhost quando BACKEND_URL não está definida', () => {
    delete process.env.BACKEND_URL;
    expect(apiBaseUrl()).toBe('http://localhost:3000');
  });
});
