import React from "react";
import { Peer } from "peerjs";
import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { GenerateRandomId } from "../utils/GenerateRandomId";

const Receive = () => {
  const [peer, setPeer] = useState("....");
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [messageCopyStatus, setMessageCopyStatus] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Not connected");
  const [files, setFiles] = useState([]);
  const [receiveProgress, setReceiveProgress] = useState({}); 

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
        
        //  file metadata
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
        //  file chunk
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
        setReceiveProgress({}); 
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Receive Files & Messages
          </h1>
        </div>
  
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
          
          {/* Left Column - ID and QR */}
          <div className="xl:col-span-1 space-y-6">
            {/* ID Section */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 p-6 rounded-xl shadow-2xl">
              <div className="text-center space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Your ID</label>
                  <div className="flex items-center justify-center gap-3">
                    <input
                      type="text"
                      value={peer}
                      readOnly
                      className="w-24 p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-200 font-mono text-2xl font-bold text-center"
                    />
                    <button
                      onClick={() => copyText(peer, setCopyStatus)}
                      className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {copyStatus || "Copy"}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <span
                    className={`font-mono text-sm px-4 py-2 rounded-lg inline-block ${
                      connectionStatus.includes("Connected by")
                        ? "text-green-400 bg-green-900/30 border border-green-500/30"
                        : connectionStatus.includes("failed")
                        ? "text-red-400 bg-red-900/30 border border-red-500/30"
                        : "text-gray-400 bg-gray-700/30 border border-gray-500/30"
                    }`}
                  >
                    {connectionStatus}
                  </span>
                </div>
              </div>
            </div>
  
            {peer && peer !== '....' && (
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 p-8 rounded-xl shadow-2xl">
                <div className="bg-white p-6 rounded-xl mx-auto" style={{ width: 'fit-content' }}>
                  <QRCode
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={peer}
                    viewBox={`0 0 256 256`}
                    level={'L'}
                    className="block"
                    width={300}
                    height={300}
                  />
                </div>
              </div>
            )}
          </div>
  
          {/* Right Column - Messages and Files */}
          <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            
            {/* Messages Section */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 p-6 rounded-xl shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-100">Messages</h2>
                {message && (
                  <button
                    onClick={() => copyText(message, setMessageCopyStatus)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg text-sm transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    {messageCopyStatus || "Copy"}
                  </button>
                )}
              </div>
              
              <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4 flex-1 overflow-y-auto">
                {message ? (
                  <p className="text-gray-200 break-words leading-relaxed">{message}</p>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center">No messages received yet</p>
                  </div>
                )}
              </div>
            </div>
  
            {/* Files Section */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 p-6 rounded-xl shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                  Files
                  <span className="px-2 py-1 bg-indigo-600/30 text-indigo-400 rounded-full text-sm font-medium border border-indigo-500/30">
                    {files.length}
                  </span>
                </h2>
              </div>
              
              <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-4 flex-1 overflow-y-auto">
                {files.length > 0 || Object.keys(receiveProgress).length > 0 ? (
                  <div className="space-y-3">
                    {/* Progress indicators for receiving files */}
                    {Object.keys(receiveProgress).map((fileId) => (
                      <div key={fileId} className="bg-gray-600/50 border border-gray-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-200 truncate flex-1 mr-3">
                            Receiving: {pendingFiles.current[fileId]?.name || 'Unknown file'}
                          </p>
                          <span className="text-xs text-indigo-400 font-mono bg-indigo-900/30 px-2 py-1 rounded">
                            {receiveProgress[fileId].toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2.5">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${receiveProgress[fileId]}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Received files */}
                    {files.map((file, index) => (
                      <div key={index} className="bg-gray-600/50 border border-gray-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-sm font-medium text-gray-200 truncate mb-1">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded inline-block">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => downloadFile(file)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg text-sm transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 flex-shrink-0"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center">No files received yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receive;