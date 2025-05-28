import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRScanner = ({ onScan }) => {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 5,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        false
      );

      scanner.render(
        (qrCodeMessage) => {
          onScan(qrCodeMessage);
          setScanning(false);
          scanner.clear();
          scannerRef.current = null;
        },
        (error) => {
          // Optional: console.log("QR error", error);
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanning, onScan]);

  return (
    <div className="flex flex-col items-center space-y-2 ">
      <button
        onClick={() => setScanning(prev => !prev)}
        className="w-full sm:w-auto px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
      >
        {scanning ? "Stop Scan" : "Scan QR"}
      </button>
      {scanning && <div id="qr-reader" className="w-full max-w-xs" />}
    </div>
  );
};

export default QRScanner;
