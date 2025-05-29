import React from "react";
import { Peer } from "peerjs";
import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { GenerateRandomId } from "../utils/GenerateRandomId";

const Receive = () => {
  const [peer, setPeer] = useState("Connecting...");
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [messageCopyStatus, setMessageCopyStatus] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Not connected");
  const [files, setFiles] = useState([]);
  const [receiveProgress, setReceiveProgress] = useState({}); // New state for progress per file

  const pendingFiles = useRef({});
  const peerRef = useRef(null);

  useEffect(() => {
    const peerId = GenerateRandomId();
    peerRef.current = new Peer(peerId);

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
        if (typeof data === "object" && data.type === "fileMetadata") {
          pendingFiles.current[data.fileId] = {
            name: data.name,
            size: data.size,
            mimeType: data.mimeType,
            totalChunks: data.totalChunks,
            chunks: [],
            receivedBytes: 0,
          };
          setReceiveProgress((prev) => ({
            ...prev,
            [data.fileId]: 0,
          }));
        }
        // Handle file chunk
        else if (typeof data === "object" && data.type === "fileChunk" && data.data) {
          const fileInfo = pendingFiles.current[data.fileId];
          if (fileInfo) {
            fileInfo.chunks.push(data.data);
            fileInfo.receivedBytes += data.data.byteLength;
            setReceiveProgress((prev) => ({
              ...prev,
              [data.fileId]: (fileInfo.receivedBytes / fileInfo.size) * 100,
            }));

            if (fileInfo.chunks.length === fileInfo.totalChunks) {
              const blob = new Blob(fileInfo.chunks, { type: fileInfo.mimeType });
              const url = URL.createObjectURL(blob);
              setFiles((prevFiles) => [
                ...prevFiles,
                { name: fileInfo.name, url, size: fileInfo.size },
              ]);
              setReceiveProgress((prev) => {
                const newProgress = { ...prev };
                delete newProgress[data.fileId];
                return newProgress;
              });
              delete pendingFiles.current[data.fileId];
            }
          }
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
        setReceiveProgress({}); // Reset progress on disconnect
      });
    });

    return () => {
      peerRef.current.destroy();
    };
  }, []);

  const copyText = async (text, setStatus) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
  
        const successful = document.execCommand("copy");
        if (!successful) throw new Error("execCommand failed");
  
        document.body.removeChild(textArea);
      }
  
      setStatus("Copied!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      setStatus("Failed to copy");
    }
  
    setTimeout(() => setStatus(""), 2000);
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
          <div className="flex flex-col items-center gap-4">
            <div className="flex w-3/5 items-center gap-2">
              <span className="text-sm">Your ID:</span>
              <input
                type="text"
                value={peer}
                readOnly
                className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed m-2"
              />
              <button
              onClick={() => copyText(peer, setCopyStatus)}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors relative">
              {copyStatus || "Copy ID"}
              </button>
            </div>
            {peer && peer !== 'Connecting...' && (
              <QRCode
                size={64}
                style={{ height: "auto", maxWidth: "40%", width: "40%" }}
                value={peer}
                viewBox={`0 0 256 256`}
                level={'L'}
                className="p-2 bg-white rounded-lg border border-gray-300 shadow-md"
              />
            )}
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
                onClick={() => copyText(message, setMessageCopyStatus)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm transition-colors">
                {messageCopyStatus || "Copy"}
                </button>)}
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
              {files.length > 0 || Object.keys(receiveProgress).length > 0 ? (
                <div className="space-y-3">
                  {Object.keys(receiveProgress).map((fileId) => (
                    <div key={fileId} className="p-3 bg-gray-600 rounded-lg">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        Receiving: {pendingFiles.current[fileId]?.name || 'Unknown file'}
                      </p>
                      <div className="w-full bg-gray-600 rounded-full h-2.5 mt-2">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full"
                          style={{ width: `${receiveProgress[fileId]}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Progress: {receiveProgress[fileId].toFixed(2)}%
                      </p>
                    </div>
                  ))}
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