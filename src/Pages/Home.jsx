import React, { useState } from "react";
import { generateUUID } from "../utils/uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = generateUUID();
    setRoomId(id);
    toast.success("Generated new room ID!");

    // If username is already provided, navigate straight away
    if (username.trim()) {
      navigate(`/editor/${id}`, {
        state: {
          username: username.trim(),
        },
      });
    } else {
      toast("Please enter your username to join the room.", {
        icon: "👉",
      });
    }
  };

  const joinRoom = () => {
    const trimmedRoomId = roomId.trim();
    const trimmedUsername = username.trim();

    if (!trimmedRoomId || !trimmedUsername) {
      toast.error("Room ID and username are required!");
      return;
    }

    navigate(`/editor/${trimmedRoomId}`, {
      state: {
        username: trimmedUsername,
      },
    });
  };

  const handleInputEnter = (e) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="homePageWrapper">
      <div className="formWrapper">
        <div className="logoContainer">
          <img
            className="codesharelogo"
            src="/codesharelogo.png"
            alt="CodeShare Logo"
          />
        </div>

        <div className="formHeader">
          <h2>Welcome to CodeShare</h2>
          <p>Collaborate and code together in real-time.</p>
        </div>

        <div className="inputgroup">
          <label htmlFor="roomId" className="visuallyHidden">Room ID</label>
          <input
            id="roomId"
            type="text"
            className="inputbox"
            placeholder="Enter room ID"
            aria-label="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleInputEnter}
          />

          <label htmlFor="username" className="visuallyHidden">Username</label>
          <input
            id="username"
            type="text"
            className="inputbox"
            placeholder="Enter your username"
            aria-label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={handleInputEnter}
          />

          <button className="btn joinbtn" onClick={joinRoom} type="button">
            Join Room →
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="createInfo">
          <span>Don't have an invitation?</span>
          <button
            type="button"
            className="createNewBtn"
            onClick={createNewRoom}
          >
            Create a new room
          </button>
        </div>
      </div>

      <footer>
        <h4>
          Built with <span className="heart" role="img" aria-label="love">💙</span> by{" "}
          <a
            href="https://linkedin.com/in/divyanshukumar017"
            target="_blank"
            rel="noopener noreferrer"
          >
            Paracetamol
          </a>
        </h4>
      </footer>
    </div>
  );
};

export default Home;
