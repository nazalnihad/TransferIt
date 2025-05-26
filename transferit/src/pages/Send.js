import React from "react";
import { Peer } from "peerjs";
import { useState, useEffect, useRef } from "react";

const Send = () => {
  const [peer, setPeer] = useState("Connecting...");
  const [receiverId, setReceiverId] = useState("");
  const [connected, setConnected] = useState("Not connected");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const connectionRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    peerRef.current = new Peer();
    peerRef.current.on("open", (id) => {
      console.log("My peer ID is: " + id);
      setPeer(id);
    });

    return () => {
      peerRef.current.destroy();
    };
  }, []);

  const handleConnect = () => {
    if (receiverId) {
      const conn = peerRef.current.connect(receiverId);
      connectionRef.current = conn;
      setConnected("Connecting...");
      
      conn.on("open", () => {
        console.log("Connected to " + receiverId);
        setConnected(`Connected to ${receiverId}`);
      });
      
      conn.on("close", () => {
        setConnected("Connection lost");
        connectionRef.current = null;
      });
      
      conn.on("error", (err) => {
        console.error("Connection error:", err);
        setConnected("Connection failed");
        connectionRef.current = null;
        setStatusMessage("Failed to connect");
        setTimeout(() => setStatusMessage(""), 3000);
      });
    } else {
      setStatusMessage("Please enter a valid peer ID");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const sendTextMessage = () => {
    if (!connectionRef.current) {
      setStatusMessage("Please connect to a peer first");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }
    if (message.trim()) {
      connectionRef.current.send(message);
      setMessage("");
      setStatusMessage("Message sent!");
      setTimeout(() => setStatusMessage(""), 3000);
    } else {
      setStatusMessage("Please enter a message");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const sendFile = () => {
    if (!connectionRef.current) {
      setStatusMessage("Please connect to a peer first");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }
    if (!file) {
      setStatusMessage("Please select a file");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }
    
    // First send file metadata
    connectionRef.current.send({
      type: "file",
      name: file.name,
      size: file.size,
      mimeType: file.type,
    });
    
    // Then send file data
    const fileReader = new FileReader();
    fileReader.onload = () => {
      connectionRef.current.send({
        type: "fileData",
        name: file.name,
        data: fileReader.result,
      });
      setStatusMessage(`File "${file.name}" sent!`);
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      setTimeout(() => setStatusMessage(""), 3000);
    };
    
    fileReader.onerror = () => {
      setStatusMessage("Failed to read file");
      setTimeout(() => setStatusMessage(""), 3000);
    };
    
    fileReader.readAsArrayBuffer(file);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      sendTextMessage();
    }
  };

  const getStatusColor = () => {
    if (connected.includes("Connected to")) return "text-green-500";
    if (connected.includes("Connecting")) return "text-yellow-500";
    if (connected.includes("failed") || connected.includes("lost")) return "text-red-500";
    return "text-gray-500";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Connection Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Send Files & Messages</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder="Enter receiver's peer ID"
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              onClick={handleConnect}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Connect
            </button>
          </div>
          <div className="mt-4 text-sm">
            Your ID: <span className="font-mono">{peer}</span>
          </div>
          <div className="mt-2 text-sm">
            Status: <span className={`font-mono ${getStatusColor()}`}>{connected}</span>
          </div>
          {statusMessage && (
            <div
              className={`mt-2 text-sm ${
                statusMessage.includes("sent") || statusMessage.includes("Message sent") 
                  ? "text-green-500" 
                  : "text-red-500"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* Text and File Input Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Message Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Send Text Message</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message (Ctrl+Enter to send)"
              rows={4}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={sendTextMessage}
              disabled={!message.trim() || !connectionRef.current}
              className="mt-4 w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Send Message
            </button>
          </div>

          {/* File Input Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Send File</h2>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
            />
            {file && (
              <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-300">Selected: {file.name}</p>
                <p className="text-xs text-gray-400">Size: {formatFileSize(file.size)}</p>
              </div>
            )}
            <button
              onClick={sendFile}
              disabled={!file || !connectionRef.current}
              className="mt-4 w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Send File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Send;