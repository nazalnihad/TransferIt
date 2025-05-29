import React from "react";
import { Peer } from "peerjs";
import { useState, useEffect, useRef } from "react";
import QRScanner from "../utils/QRScanner";
import { GenerateRandomId } from "../utils/GenerateRandomId";

const Send = () => {
  const [peer, setPeer] = useState("Connecting...");
  const [receiverId, setReceiverId] = useState("");
  const [connected, setConnected] = useState("Not connected");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0); // New state for progress

  const connectionRef = useRef(null);
  const peerRef = useRef(null);
  

  useEffect(() => {
    const peerId = GenerateRandomId();
    peerRef.current = new Peer(peerId);
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
  
      // Set timeout for connection attempt
      const timeout = setTimeout(() => {
        if (conn.open === false) {
          console.warn("Connection timed out");
          setConnected("Connection timed out");
          setStatusMessage("Unable to connect. Please check the ID or try again.");
          conn.close(); // Close connection attempt
          connectionRef.current = null;
        }
      }, 10000); // 10 seconds
  
      conn.on("open", () => {
        clearTimeout(timeout); // Clear the timeout on success
        console.log("Connected to " + receiverId);
        setConnected(`Connected to ${receiverId}`);
      });
  
      conn.on("close", () => {
        clearTimeout(timeout); // Clear timeout if closed before timeout triggers
        setConnected("Connection lost");
        connectionRef.current = null;
      });
  
      conn.on("error", (err) => {
        clearTimeout(timeout);
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

  const sendFile = async () => {
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

    const CHUNK_SIZE = 1024 * 64; // 64kb chunks
    const fileReader = new FileReader();
    let offset = 0;
    const totalSize = file.size;
    const fileId = `${file.name}-${Date.now()}`; // Unique ID for this file transfer

    // Send file metadata first
    connectionRef.current.send({
      type: "fileMetadata",
      fileId,
      name: file.name,
      size: totalSize,
      mimeType: file.type,
      totalChunks: Math.ceil(totalSize / CHUNK_SIZE),
    });

    const readChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      fileReader.readAsArrayBuffer(slice);
    };

    fileReader.onload = () => {
      if (!connectionRef.current) {
        setStatusMessage("Connection lost during transfer");
        setProgress(0);
        setFile(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        setTimeout(() => setStatusMessage(""), 3000);
        return;
      }

      connectionRef.current.send({
        type: "fileChunk",
        fileId,
        data: fileReader.result,
        offset,
      });

      offset += CHUNK_SIZE;
      setProgress(Math.min((offset / totalSize) * 100, 100));

      if (offset < totalSize) {
        readChunk();
      } else {
        setStatusMessage(`File "${file.name}" sent!`);
        setProgress(0);
        setFile(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        setTimeout(() => setStatusMessage(""), 3000);
      }
    };

    fileReader.onerror = () => {
      setStatusMessage("Failed to read file");
      setProgress(0);
      setTimeout(() => setStatusMessage(""), 3000);
    };

    readChunk();
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
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Send Files & Messages</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-4 sm:space-y-0">
            <input
              type="text"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder="Enter receiver's peer ID"
              className="w-full sm:flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              onClick={handleConnect}
              className="w-full sm:w-auto px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Connect
            </button>
            <div className="w-full sm:w-auto">
              <QRScanner onScan={(data) => setReceiverId(data)} />
            </div>
          </div>
          <div className="mt-4 text-sm">
            Your ID: <span className="font-mono break-all">{peer}</span>
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
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Send Text Message</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
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
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
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
            {progress > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Progress: {progress.toFixed(2)}%
                </p>
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
}

export default Send;