"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { isBoxIntersectingPolygon, Point, Box } from "../utils/roiLogic";
import { AlertTriangle, CheckCircle, Smartphone } from "lucide-react";

export default function CameraView() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [model, setModel] = useState<cocossd.ObjectDetection | null>(null);
    const [loading, setLoading] = useState(true);
    const [alertTriggered, setAlertTriggered] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    // Default ROI (Center 50% box) - Will be scaled to video size dynamically
    const [roiRelative, setRoiRelative] = useState<Point[]>([
        { x: 0.2, y: 0.2 },
        { x: 0.8, y: 0.2 },
        { x: 0.8, y: 0.8 },
        { x: 0.2, y: 0.8 },
    ]);

    // Load Model
    useEffect(() => {
        const loadModel = async () => {
            // Set backend to WebGL for GPU acceleration (standard for phones)
            await tf.setBackend('webgl');
            const loadedModel = await cocossd.load();
            setModel(loadedModel);
            setLoading(false);
        };
        loadModel();
    }, []);

    // Detection Loop
    const runDetection = useCallback(async () => {
        if (!model || !webcamRef.current || !webcamRef.current.video || !canvasRef.current) return;

        const video = webcamRef.current.video;

        // Check if video is ready
        if (video.readyState !== 4) return;
        if (!cameraReady) setCameraReady(true);

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // Match canvas size to video size
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        // 1. Detect
        const predictions = await model.detect(video);

        // 2. Prepare ROI (Scale relative coords to actual pixels)
        const roiPoints = roiRelative.map(p => ({
            x: p.x * videoWidth,
            y: p.y * videoHeight
        }));

        // 3. Check for Intrusion
        let isIntrusion = false;

        // Clear canvas
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        predictions.forEach(prediction => {
            if (prediction.class === 'person') {
                const [x, y, w, h] = prediction.bbox;
                const box: Box = { x, y, width: w, height: h };

                // Check Intersection
                const intersecting = isBoxIntersectingPolygon(box, roiPoints);
                if (intersecting) isIntrusion = true;

                // Draw Box
                ctx.strokeStyle = intersecting ? "#FF0000" : "#00FF00";
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, w, h);

                // Draw Label
                ctx.fillStyle = intersecting ? "#FF0000" : "#00FF00";
                ctx.font = "18px Arial";
                ctx.fillText(
                    intersecting ? "ALERT!" : "Safe",
                    x,
                    y > 10 ? y - 5 : 10
                );
            }
        });

        setAlertTriggered(isIntrusion);

        // 4. Draw ROI Polygon
        ctx.strokeStyle = isIntrusion ? "rgba(255, 0, 0, 0.8)" : "rgba(0, 255, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(roiPoints[0].x, roiPoints[0].y);
        for (let i = 1; i < roiPoints.length; i++) {
            ctx.lineTo(roiPoints[i].x, roiPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Fill ROI lightly
        ctx.fillStyle = isIntrusion ? "rgba(255, 0, 0, 0.2)" : "rgba(0, 255, 0, 0.1)";
        ctx.fill();

        // Loop
        requestAnimationFrame(runDetection);

    }, [model, roiRelative, cameraReady]);

    // Trigger loop when model and camera are ready
    useEffect(() => {
        if (model && !loading) {
            const interval = setInterval(() => {
                runDetection();
            }, 100); // 10 FPS check to save battery? Or use requestAnimation frame loop starter
            return () => clearInterval(interval);
        }
    }, [model, loading, runDetection]);


    return (
        <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">

            {/* Loading State */}
            {loading && (
                <div className="absolute z-50 flex flex-col items-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p>Loading AI Model...</p>
                </div>
            )}

            {/* Main Camera Feed */}
            <Webcam
                ref={webcamRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted={true}
                videoConstraints={{
                    facingMode: "environment" // Use Rear Camera on Mobile
                }}
            />

            {/* Canvas Overlay */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-4 z-40 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center justify-between text-white">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Smartphone className="w-6 h-6" />
                        CV Sentinel
                    </h1>
                    <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${alertTriggered ? 'bg-red-600 animate-pulse' : 'bg-green-600/80'}`}>
                        {alertTriggered ? (
                            <>
                                <AlertTriangle className="w-5 h-5" />
                                INTRUSION
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                SECURE
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions / Footer */}
            {!loading && !cameraReady && (
                <div className="absolute bottom-10 z-50 text-white bg-black/50 px-4 py-2 rounded-lg">
                    Waiting for camera permission...
                </div>
            )}

            {alertTriggered && (
                <div className="absolute inset-0 border-[10px] border-red-600 z-30 pointer-events-none animate-pulse"></div>
            )}

        </div>
    );
}
