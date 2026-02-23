"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import CryptoJS from "crypto-js";

let socket: Socket;
const secretKey = "ghost-secret-key";

export default function Chat() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { text: string; sender: string }[]
  >([]);
  const [username, setUsername] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket = io("http://localhost:3000");

    const randomName =
      "Ghost-" + Math.floor(Math.random() * 10000);
    setUsername(randomName);

    socket.on("receive-message", (encryptedMessage: string) => {
      const bytes = CryptoJS.AES.decrypt(
        encryptedMessage,
        secretKey
      );
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      const [sender, text] = decrypted.split(": ");

      setMessages((prev) => [...prev, { sender, text }]);

      setTimeout(() => {
        setMessages((prev) => prev.slice(1));
      }, 10000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const joinRoom = () => {
    if (!roomId) return;
    socket.emit("join-room", roomId);
    setJoined(true);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const fullMessage = `${username}: ${message}`;

    const encrypted = CryptoJS.AES.encrypt(
      fullMessage,
      secretKey
    ).toString();

    socket.emit("send-message", {
      roomId,
      encryptedMessage: encrypted,
    });

    setMessage("");
  };

  if (!joined) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.card}>
          <h2 style={{ color: "white" }}>👻 Enter Room</h2>
          <input
            style={styles.input}
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button style={styles.button} onClick={joinRoom}>
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.chatWrapper}>
      <div style={styles.chatContainer}>
        <div style={styles.header}>
          👻 Room: {roomId}
        </div>

        <div style={styles.messagesArea}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.messageBubble,
                alignSelf:
                  msg.sender === username
                    ? "flex-end"
                    : "flex-start",
                backgroundColor:
                  msg.sender === username
                    ? "#4e8cff"
                    : "#2a2a2a",
              }}
            >
              <strong>{msg.sender}</strong>
              <div>{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.inputChat}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
          />
          <button style={styles.sendBtn} onClick={sendMessage}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  centerContainer: {
    height: "100vh",
    backgroundColor: "#0f0f0f",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: "30px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "350px",
    textAlign: "center",
  },
  chatWrapper: {
    height: "100vh",
    backgroundColor: "#0f0f0f",
    display: "flex",
    justifyContent: "center",
  },
  chatContainer: {
    width: "100%",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "15px",
    backgroundColor: "#1c1c1c",
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  messagesArea: {
    flex: 1,
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    gap: "10px",
  },
  messageBubble: {
    padding: "10px 15px",
    borderRadius: "12px",
    color: "white",
    maxWidth: "70%",
    fontSize: "14px",
  },
  inputArea: {
    display: "flex",
    padding: "10px",
    backgroundColor: "#1c1c1c",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "none",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#4e8cff",
    color: "white",
    border: "none",
    borderRadius: "8px",
  },
  inputChat: {
    flex: 1,
    padding: "10px",
    borderRadius: "20px",
    border: "none",
  },
  sendBtn: {
    marginLeft: "10px",
    padding: "10px 15px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#4e8cff",
    color: "white",
  },
};