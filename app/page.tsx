"use client";

import { useState } from "react";
import CameraView from "../components/CameraView";
import { Shield, Camera } from "lucide-react";

export default function Home() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return (
    <main className="min-h-screen bg-neutral-950 text-white font-sans">
      {!isCameraOpen ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8 bg-gradient-to-b from-neutral-900 to-black">

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-violet-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-8 bg-black rounded-full ring-1 ring-gray-900/5">
              <Shield className="w-24 h-24 text-red-500" />
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
              CV Sentinel
            </h1>
            <p className="text-gray-400 text-lg">
              Advanced Client-Side Human Detection System.
              <br />
              <span className="text-sm">Powered by TensorFlow.js</span>
            </p>
          </div>

          <button
            onClick={() => setIsCameraOpen(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-red-600 font-lg rounded-xl hover:bg-red-700 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] focus:outline-none ring-offset-2 focus:ring-2 ring-red-500"
          >
            <Camera className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Start Surveillance
          </button>

          <footer className="absolute bottom-6 text-xs text-gray-600">
            Runs offline • Private • No Server Latency
          </footer>
        </div>
      ) : (
        <CameraView />
      )}
    </main>
  );
}
