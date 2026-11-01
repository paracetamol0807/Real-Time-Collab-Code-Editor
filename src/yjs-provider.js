import * as Y from "yjs";
import ACTIONS from "./Actions";

/**
 * Lightweight Yjs provider that uses an existing Socket.io connection
 * as the transport layer.
 */
export class SocketIOProvider {
  constructor(socket, roomId, ydoc) {
    this.socket = socket;
    this.roomId = roomId;
    this.ydoc = ydoc;
    this._destroyed = false;

    // ── Receive: full state or sync response from server ────────────────────
    this._onSyncStep2 = ({ update }) => {
      if (this._destroyed || !update) return;
      try {
        Y.applyUpdate(this.ydoc, new Uint8Array(update), this);
      } catch (e) {
        console.error("[YjsProvider] applyUpdate (step2) failed:", e);
      }
    };

    // ── Receive: incremental update from another peer ───────────────────────
    this._onUpdate = ({ update }) => {
      if (this._destroyed || !update) return;
      try {
        Y.applyUpdate(this.ydoc, new Uint8Array(update), this);
      } catch (e) {
        console.error("[YjsProvider] applyUpdate (update) failed:", e);
      }
    };

    // ── Send: push every local change to the server ─────────────────────────
    this._docUpdateHandler = (update, origin) => {
      // Avoid echoing updates that originated from this provider (remote socket updates)
      if (origin === this || this._destroyed) return;
      this.socket.emit(ACTIONS.YJS_UPDATE, {
        roomId: this.roomId,
        update: Array.from(update),
      });
    };

    socket.on(ACTIONS.YJS_SYNC_STEP2, this._onSyncStep2);
    socket.on(ACTIONS.YJS_UPDATE, this._onUpdate);
    this.ydoc.on("update", this._docUpdateHandler);

    // Initial sync: request missing updates for this room
    const stateVector = Y.encodeStateVector(this.ydoc);
    socket.emit(ACTIONS.YJS_SYNC_STEP1, {
      roomId: this.roomId,
      stateVector: Array.from(stateVector),
    });
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this.socket) {
      this.socket.off(ACTIONS.YJS_SYNC_STEP2, this._onSyncStep2);
      this.socket.off(ACTIONS.YJS_UPDATE, this._onUpdate);
    }
    if (this.ydoc) {
      this.ydoc.off("update", this._docUpdateHandler);
    }
  }
}
