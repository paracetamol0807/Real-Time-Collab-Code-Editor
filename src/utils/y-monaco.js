import * as Y from "yjs";

class RelativeSelection {
  constructor(start, end, direction) {
    this.start = start;
    this.end = end;
    this.direction = direction;
  }
}

const createRelativeSelection = (editor, monacoModel, type) => {
  const sel = editor.getSelection();
  if (sel !== null) {
    const startPos = sel.getStartPosition();
    const endPos = sel.getEndPosition();
    const start = Y.createRelativePositionFromTypeIndex(
      type,
      monacoModel.getOffsetAt(startPos)
    );
    const end = Y.createRelativePositionFromTypeIndex(
      type,
      monacoModel.getOffsetAt(endPos)
    );
    return new RelativeSelection(start, end, sel.getDirection());
  }
  return null;
};

const createMonacoSelectionFromRelativeSelection = (
  editor,
  type,
  relSel,
  doc,
  monaco
) => {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc);
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc);
  if (start !== null && end !== null && start.type === type && end.type === type) {
    const model = editor.getModel();
    const startPos = model.getPositionAt(start.index);
    const endPos = model.getPositionAt(end.index);
    if (monaco?.Selection?.createWithDirection) {
      return monaco.Selection.createWithDirection(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column,
        relSel.direction
      );
    }
    if (monaco?.Selection) {
      return new monaco.Selection(
        startPos.lineNumber,
        startPos.column,
        endPos.lineNumber,
        endPos.column
      );
    }
    return {
      startLineNumber: startPos.lineNumber,
      startColumn: startPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: endPos.column,
    };
  }
  return null;
};

const createMutex = () => {
  let token = true;
  return (f) => {
    if (token) {
      token = false;
      try {
        f();
      } finally {
        token = true;
      }
    }
  };
};

const createRange = (monaco, startLine, startCol, endLine, endCol) => {
  if (monaco?.Range) {
    return new monaco.Range(startLine, startCol, endLine, endCol);
  }
  return {
    startLineNumber: startLine,
    startColumn: startCol,
    endLineNumber: endLine,
    endColumn: endCol,
  };
};

/**
 * MonacoBinding binds a Y.Text to a Monaco editor model.
 * Uses the runtime `monaco` instance provided by @monaco-editor/react.
 */
export class MonacoBinding {
  constructor(ytext, monacoModel, editors = new Set(), monaco) {
    this.doc = ytext.doc;
    this.ytext = ytext;
    this.monacoModel = monacoModel;
    this.editors = editors;
    this.monaco = monaco;
    this.mux = createMutex();
    this._savedSelections = new Map();

    this._beforeTransaction = () => {
      this.mux(() => {
        this._savedSelections = new Map();
        editors.forEach((editor) => {
          if (editor.getModel() === monacoModel) {
            const rsel = createRelativeSelection(editor, monacoModel, ytext);
            if (rsel !== null) {
              this._savedSelections.set(editor, rsel);
            }
          }
        });
      });
    };
    this.doc.on("beforeAllTransactions", this._beforeTransaction);

    this._ytextObserver = (event) => {
      this.mux(() => {
        let index = 0;
        event.delta.forEach((op) => {
          if (op.retain !== undefined) {
            index += op.retain;
          } else if (op.insert !== undefined) {
            const pos = monacoModel.getPositionAt(index);
            const range = createRange(
              this.monaco,
              pos.lineNumber,
              pos.column,
              pos.lineNumber,
              pos.column
            );
            const insert = op.insert;
            monacoModel.applyEdits([{ range, text: insert }]);
            index += insert.length;
          } else if (op.delete !== undefined) {
            const pos = monacoModel.getPositionAt(index);
            const endPos = monacoModel.getPositionAt(index + op.delete);
            const range = createRange(
              this.monaco,
              pos.lineNumber,
              pos.column,
              endPos.lineNumber,
              endPos.column
            );
            monacoModel.applyEdits([{ range, text: "" }]);
          }
        });

        this._savedSelections.forEach((rsel, editor) => {
          const sel = createMonacoSelectionFromRelativeSelection(
            editor,
            ytext,
            rsel,
            this.doc,
            this.monaco
          );
          if (sel !== null) {
            editor.setSelection(sel);
          }
        });
      });
    };
    ytext.observe(this._ytextObserver);

    // Initial sync: populate Monaco model with ytext value if present
    const ytextValue = ytext.toString();
    if (ytextValue && monacoModel.getValue() !== ytextValue) {
      monacoModel.setValue(ytextValue);
    }

    // Capture Monaco editor changes and reflect them in ytext
    this._monacoChangeHandler = monacoModel.onDidChangeContent((event) => {
      this.mux(() => {
        this.doc.transact(() => {
          const changes = [...event.changes].sort(
            (c1, c2) => c2.rangeOffset - c1.rangeOffset
          );
          changes.forEach((change) => {
            ytext.delete(change.rangeOffset, change.rangeLength);
            ytext.insert(change.rangeOffset, change.text);
          });
        }, this);
      });
    });

    this._monacoDisposeHandler = monacoModel.onWillDispose(() => {
      this.destroy();
    });
  }

  destroy() {
    if (this._monacoChangeHandler) {
      this._monacoChangeHandler.dispose();
      this._monacoChangeHandler = null;
    }
    if (this._monacoDisposeHandler) {
      this._monacoDisposeHandler.dispose();
      this._monacoDisposeHandler = null;
    }
    if (this.ytext) {
      this.ytext.unobserve(this._ytextObserver);
    }
    if (this.doc) {
      this.doc.off("beforeAllTransactions", this._beforeTransaction);
    }
  }
}
