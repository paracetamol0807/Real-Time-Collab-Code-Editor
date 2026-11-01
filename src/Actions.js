const ACTIONS = {
  JOIN: "join",
  JOINED: "joined",
  DISCONNECTED: "disconnected",
  CODE_CHANGE: "code-change",
  SYNC_CODE: "sync-code",
  LANGUAGE_CHANGE: "language-change",
  LEAVE: "leave",

  // Yjs CRDT synchronization events
  YJS_UPDATE: "yjs-update",
  YJS_SYNC_STEP1: "yjs-sync-step1",
  YJS_SYNC_STEP2: "yjs-sync-step2",
};

module.exports = ACTIONS;
