import React, { useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import ACTIONS from "../Actions";

const mapToMonacoLanguage = (lang) => {
  if (lang === "text") return "plaintext";
  return lang || "plaintext";
};

const Editor = ({ socket, roomId, onCodeChange, language = "javascript" }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const monacoLanguage = mapToMonacoLanguage(language);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Report initial editor content to parent so code is immediately tracked
    if (onCodeChange) {
      onCodeChange(editor.getValue());
    }

    // Set initial model language explicitly
    if (editor && monaco && monacoLanguage) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, monacoLanguage);
      }
    }
  };

  const handleEditorChange = (value) => {
    const code = value ?? "";
    onCodeChange(code);

    if (socket) {
      socket.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        code,
      });
    }
  };

  // Explicitly update model language whenever language prop changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current && monacoLanguage) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, monacoLanguage);
      }
    }
  }, [monacoLanguage]);

  // Handle incoming remote code changes
  useEffect(() => {
    if (!socket) return;

    const handleRemoteCodeChange = ({ code }) => {
      if (editorRef.current && code !== null && code !== undefined) {
        const currentCode = editorRef.current.getValue();
        if (currentCode !== code) {
          editorRef.current.setValue(code);
        }
      }
    };

    socket.on(ACTIONS.CODE_CHANGE, handleRemoteCodeChange);

    return () => {
      socket.off(ACTIONS.CODE_CHANGE, handleRemoteCodeChange);
    };
  }, [socket]);

  return (
    <div className="monacoEditorWrapper">
      <MonacoEditor
        height="100%"
        language={monacoLanguage}
        theme="vs-dark"
        defaultValue="// Welcome to CodeShare! Start typing together in real-time...\n\nfunction helloWorld() {\n  console.log('Collaborating live with CodeShare');\n}\n\nhelloWorld();\n"
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          automaticLayout: true,
          tabSize: 2,
          lineNumbersMinChars: 3,
          padding: { top: 16 },
        }}
      />
    </div>
  );
};

export default Editor;
