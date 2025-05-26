import React from "react";
import { Peer } from "peerjs";
import { useState, useEffect, useRef } from "react";

const Receive = () => {
  const [peer, setPeer] = useState("Connecting...");
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [messageCopyStatus, setMessageCopyStatus] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Not connected");
  const [files, setFiles] = useState([]);

  const pendingFiles = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    peerRef.current = new Peer();

    peerRef.current.on("open", (id) => {
      console.log("My peer ID is: " + id);
      setPeer(id);
    });

    peerRef.current.on("connection", (conn) => {
      console.log("Connection received from: " + conn.peer);
      setConnectionStatus(`Connected by ${conn.peer}`);
      
      conn.on("data", (data) => {
        console.log("Received data:", data);
        
        // Handle file metadata
        if (typeof data === "object" && data.type === "file") {
          pendingFiles.current = {
            name: data.name,
            size: data.size,
            mimeType: data.mimeType,
          };
        }
        // Handle file data (new format from Send component)
        else if (typeof data === "object" && data.type === "fileData" && data.data) {
          const blob = new Blob([data.data], { type: pendingFiles.current?.mimeType || 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          setFiles((prevFiles) => [
            ...prevFiles,
            { 
              name: data.name || pendingFiles.current?.name || 'Unknown file', 
              url, 
              size: pendingFiles.current?.size || data.data.byteLength 
            },
          ]);
          pendingFiles.current = null;
        }
        // Handle direct ArrayBuffer (fallback)
        else if (pendingFiles.current && data instanceof ArrayBuffer) {
          const blob = new Blob([data], { type: pendingFiles.current.mimeType });
          const url = URL.createObjectURL(blob);
          setFiles((prevFiles) => [
            ...prevFiles,
            { name: pendingFiles.current.name, url, size: pendingFiles.current.size },
          ]);
          pendingFiles.current = null;
        }
        // Handle text messages
        else if (typeof data === "string") {
          setMessage(data);
        }
      });

      conn.on("error", (err) => {
        console.error("Connection error:", err);
        setConnectionStatus("Connection failed");
      });

      conn.on("close", () => {
        console.log("Connection closed by: " + conn.peer);
        setConnectionStatus("Not connected");
      });
    });

    return () => {
      peerRef.current.destroy();
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(peer);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setMessageCopyStatus("Copied!");
      setTimeout(() => setMessageCopyStatus(""), 2000);
    } catch (err) {
      console.error("Failed to copy message: ", err);
      setMessageCopyStatus("Failed to copy");
      setTimeout(() => setMessageCopyStatus(""), 2000);
    }
  };

  const downloadFile = (file) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        {/* Peer ID Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Receive Files & Messages</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Your ID:</span>
            <input
              type="text"
              value={peer}
              readOnly
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors relative"
            >
              {copyStatus || "Copy ID"}
            </button>
          </div>
          <div className="mt-2 text-sm">
            Status:{" "}
            <span
              className={`font-mono ${
                connectionStatus.includes("Connected by")
                  ? "text-green-500"
                  : connectionStatus.includes("failed")
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            >
              {connectionStatus}
            </span>
          </div>
        </div>

        {/* Messages and Files Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Messages Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Messages</h2>
              {message && (
                <button
                  onClick={copyMessage}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm transition-colors"
                >
                  {messageCopyStatus || "Copy"}
                </button>
              )}
            </div>
            <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg min-h-[100px]">
              {message ? (
                <p className="text-gray-300 break-words">{message}</p>
              ) : (
                <p className="text-gray-500">No messages received</p>
              )}
            </div>
          </div>

          {/* Files Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Files ({files.length})</h2>
            <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg min-h-[100px] max-h-[300px] overflow-y-auto">
              {files.length > 0 ? (
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-600 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => downloadFile(file)}
                        className="ml-3 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors flex-shrink-0"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No files received</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receive;