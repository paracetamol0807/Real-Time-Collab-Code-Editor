/**
 * Jest mock for y-monaco.
 *
 * monaco-editor (a peer dependency of y-monaco) ships pure ESM that CRA's
 * Jest 27 / jsdom cannot parse. Since Monaco cannot run in jsdom at all,
 * we stub the entire binding with a no-op class.
 */
const MonacoBinding = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
}));

module.exports = { MonacoBinding };

