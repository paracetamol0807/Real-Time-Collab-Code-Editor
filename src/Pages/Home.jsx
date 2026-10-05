import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("Guest");

  const createNewRoom = (e) => {
    e.preventDefault();

    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room!");
  };
  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Room Id and username is required !");
      return;

      // Redirect
      navigate(`./editor/${roomId}`, {
        state: {
          username,
        },
      });
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
          <input
            id="roomId"
            type="text"
            className="inputbox"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <input
            id="username"
            type="text"
            className="inputbox"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button className="btn joinbtn" onClick={joinRoom}>
            Join Room →
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="createInfo">
          <span>Don't have an invitation?</span>
          <a href="" onClick={createNewRoom} className="createNewBtn">
            Create a new room
          </a>
        </div>
      </div>

      <footer>
        <h4>
          Built with <span className="heart">💙</span> by{" "}
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
