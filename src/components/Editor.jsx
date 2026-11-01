import React, { useState, useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "../utils/y-monaco";
import { SocketIOProvider } from "../yjs-provider";

const mapToMonacoLanguage = (lang) => {
  if (lang === "text") return "plaintext";
  return lang || "plaintext";
};

const Editor = ({ socket, roomId, language = "javascript" }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  const [editorReady, setEditorReady] = useState(false);
  const monacoLanguage = mapToMonacoLanguage(language);

  // ── 1. Monaco mount handler ──────────────────────────────────────────────
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Explicitly set language on initial mount
    const model = editor.getModel();
    if (model && monacoLanguage) {
      monaco.editor.setModelLanguage(model, monacoLanguage);
    }

    // Only clean up when Monaco itself disposes (avoids React StrictMode unmount traps)
    editor.onDidDispose(() => {
      bindingRef.current?.destroy();
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
      bindingRef.current = null;
      providerRef.current = null;
      ydocRef.current = null;
      editorRef.current = null;
      monacoRef.current = null;
    });

    setEditorReady(true);
  };

  // ── 2. Initialize Yjs & Socket provider once editor + socket are ready ────
  useEffect(() => {
    if (!socket || !editorReady || !editorRef.current || !monacoRef.current) {
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();

    // Create shared Yjs doc & text type (persists across StrictMode renders)
    if (!ydocRef.current) {
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;
      const yText = ydoc.getText("monaco");

      bindingRef.current = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        monaco
      );
    }

    // Connect to the room Yjs relay via Socket.io
    if (!providerRef.current) {
      providerRef.current = new SocketIOProvider(
        socket,
        roomId,
        ydocRef.current
      );
    }

    return () => {
      // Disconnect socket provider if socket or roomId changes
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, [socket, roomId, editorReady]);

  // ── 3. Language prop changes: update Monaco model language ───────────────
  useEffect(() => {
    if (editorRef.current && monacoRef.current && monacoLanguage) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, monacoLanguage);
      }
    }
  }, [monacoLanguage]);

  return (
    <div className="monacoEditorWrapper">
      <MonacoEditor
        height="100%"
        language={monacoLanguage}
        theme="vs-dark"
        defaultValue="" // Managed entirely by Yjs CRDT doc
        onMount={handleEditorDidMount}
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
