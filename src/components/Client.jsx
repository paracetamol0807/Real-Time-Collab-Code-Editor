import React from "react";

// Generate a deterministic pastel color for a username
const getAvatarColor = (name = "") => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const Client = ({ username }) => {
  const initial = username ? username.charAt(0).toUpperCase() : "?";
  const avatarBg = getAvatarColor(username);

  return (
    <div className="clientItem">
      <div className="clientAvatar" style={{ backgroundColor: avatarBg }}>
        {initial}
      </div>
      <div className="clientDetails">
        <span className="userName" title={username}>
          {username}
        </span>
        <span className="userStatus">
          <span className="statusDot"></span> online
        </span>
      </div>
    </div>
  );
};

export default Client;

