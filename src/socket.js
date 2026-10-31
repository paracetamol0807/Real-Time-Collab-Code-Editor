import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    forceNew: true,
    reconnectionAttempts: 5,
    timeout: 10000,
    transports: ["websocket"],
  };

  const backendUrl =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  return io(backendUrl, options);
};
