/**
 * Jest mock for @monaco-editor/react.
 *
 * The real package lazy-loads monaco-editor from a CDN / webpack bundle,
 * which cannot work in jsdom. We return a simple <div> stub so that any
 * component tree that renders <MonacoEditor> doesn't crash in tests.
 */
const React = require('react');

const MonacoEditor = jest.fn(({ onMount }) => {
  // Call onMount with minimal stubs so Editor.jsx's handleEditorDidMount
  // doesn't throw when referenced in tests.
  React.useEffect(() => {
    if (onMount) {
      const editorStub = {
        getValue: () => '',
        setValue: jest.fn(),
        getModel: () => ({
          getValue: () => '',
        }),
        onDidChangeModelContent: jest.fn(),
      };
      const monacoStub = {
        editor: {
          setModelLanguage: jest.fn(),
        },
      };
      onMount(editorStub, monacoStub);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return React.createElement('div', { 'data-testid': 'monaco-editor-stub' });
});

module.exports = MonacoEditor;
module.exports.default = MonacoEditor;

