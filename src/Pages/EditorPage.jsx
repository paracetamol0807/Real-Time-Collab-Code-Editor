import React, { useState, useRef, useEffect } from "react";
import {
  useParams,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import { initSocket } from "../socket";
import Client from "../components/Client";
import Editor from "../components/Editor";

const LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Markdown", value: "markdown" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "SQL", value: "sql" },
  { label: "Text", value: "text" },
];

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const languageRef = useRef("javascript");
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("javascript");

  const username = location.state?.username;

  useEffect(() => {
    if (!username) return;

    let isMounted = true;
    let currentSocket = null;

    const init = async () => {
      try {
        const s = await initSocket();
        currentSocket = s;

        if (!isMounted) {
          s.disconnect();
          return;
        }

        socketRef.current = s;
        setSocket(s);

        const handleErrors = (err) => {
          console.error("Socket connection error:", err);
          toast.error("Socket connection failed. Ensure server is running on port 5001.", {
            id: "socket-error-toast",
          });
          s.disconnect();
          navigate("/");
        };

        s.on("connect_error", handleErrors);
        s.on("connect_failed", handleErrors);

        // Join the room
        s.emit(ACTIONS.JOIN, {
          roomId,
          username,
        });

        // Listen for new clients joining
        s.on(
          ACTIONS.JOINED,
          ({ clients: roomClients, username: joinedUser, socketId }) => {
            if (!isMounted) return;

            if (joinedUser !== username) {
              toast.success(`${joinedUser} joined the room!`);
            }

            setClients(roomClients);

            // Sync current editor code & language to the newcomer
            s.emit(ACTIONS.SYNC_CODE, {
              code: codeRef.current,
              language: languageRef.current,
              socketId,
            });
          }
        );

        // Listen for real-time language changes from other peers
        s.on(ACTIONS.LANGUAGE_CHANGE, ({ language: newLang }) => {
          if (!isMounted) return;
          setLanguage(newLang);
          languageRef.current = newLang;
          const langObj = LANGUAGES.find((l) => l.value === newLang);
          toast(`Language switched to ${langObj?.label || newLang}`, {
            icon: "🔤",
            id: "lang-change-toast",
          });
        });

        // Listen for client disconnection
        s.on(
          ACTIONS.DISCONNECTED,
          ({ socketId, username: leftUser }) => {
            if (!isMounted) return;

            if (leftUser) {
              toast(`${leftUser} left the room.`, { icon: "👋" });
            }

            setClients((prev) =>
              prev.filter((client) => client.socketId !== socketId)
            );
          }
        );
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        toast.error("Failed to connect to collaboration server.", {
          id: "socket-init-error",
        });
        navigate("/");
      }
    };

    init();

    return () => {
      isMounted = false;
      if (currentSocket) {
        currentSocket.disconnect();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      }
    };
  }, [roomId, username, navigate]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    languageRef.current = newLang;

    const s = socketRef.current || socket;
    if (s) {
      s.emit(ACTIONS.LANGUAGE_CHANGE, {
        roomId,
        language: newLang,
      });
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy Room ID");
      console.error(err);
    }
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    toast("Left the room", { icon: "🚪" });
    navigate("/");
  };

  // Redirect if username is missing (e.g. direct link or page reload)
  if (!username) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mainWrap">
      {/* Left Sidebar */}
      <aside className="aside">
        <div className="asideInner">
          <div className="asideLogoContainer">
            <img
              src="/codesharelogo.png"
              alt="CodeShare"
              className="asideLogo"
            />
            <h1 className="asideBrandTitle">CodeShare</h1>
          </div>

          <div className="connectedSection">
            <div className="connectedHeader">
              <h2 className="connectedTitle">Connected Users</h2>
              <span className="connectedCount">{clients.length} online</span>
            </div>

            <div className="clientsList">
              {clients.map((client) => (
                <Client
                  key={client.socketId}
                  username={client.username}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="sidebarFooter">
          <button
            type="button"
            className="actionBtn copyBtn"
            onClick={copyRoomId}
          >
            📋 Copy Room ID
          </button>
          <button
            type="button"
            className="actionBtn leaveBtn"
            onClick={leaveRoom}
          >
            Leave Room
          </button>
        </div>
      </aside>

      {/* Main Editor */}
      <main className="editorWrap">
        <header className="editorHeader">
          <div className="editorHeaderLeft">
            <div className="editorRoomBadge">
              Room: <span>{roomId}</span>
            </div>
          </div>

          <div className="editorHeaderRight">
            <select
              className="languageSelect"
              value={language}
              onChange={handleLanguageChange}
              aria-label="Select Programming Language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <Editor
          socket={socket}
          roomId={roomId}
          language={language}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
      </main>
    </div>
  );
};

export default EditorPage;
