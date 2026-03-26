import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import * as faceapi from "face-api.js";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import {
  Camera,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  ScanFace,
  ShieldAlert,
} from "lucide-react";
import Button from "./Button";

const MEDIAPIPE_WASM_ROOT =
  import.meta.env.VITE_MEDIAPIPE_WASM_ROOT ||
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

const MEDIAPIPE_MODEL_URL =
  import.meta.env.VITE_MEDIAPIPE_MODEL_URL ||
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const FACE_API_MODEL_URL =
  import.meta.env.VITE_FACE_MODEL_URL ||
  "https://justadudewhohacks.github.io/face-api.js/models";

const FACE_API_DETECTOR = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.45,
});

const MIN_BRIGHTNESS = 45;
const MAX_BRIGHTNESS = 235;
const MIN_SHARPNESS = 10;
const MIN_FACE_WIDTH_RATIO = 0.16;
const MIN_FACE_HEIGHT_RATIO = 0.2;
const MAX_CENTER_OFFSET_RATIO = 0.22;
const MAX_ROLL = 0.18;

const FRONT_YAW_MAX = 0.09;
const SIDE_YAW_MIN = 0.08;

const EYES_OPEN_MAX_BLINK_SCORE = 0.38;
const MOUTH_CLOSED_MAX = 0.20;
const REQUIRED_NEUTRAL_FRAMES = 4;
const REQUIRED_CHALLENGE_FRAMES = 3;
const CAPTURE_TIMEOUT_MS = 18000;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function averagePoint(points) {
  const total = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );
  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function averageVectors(vectors) {
  if (!vectors.length) return [];
  const size = vectors[0].length;
  const sum = Array.from({ length: size }, () => 0);

  vectors.forEach((vector) => {
    vector.forEach((value, index) => {
      sum[index] += value;
    });
  });

  return sum.map((value) => value / vectors.length);
}

function getFrameMetrics(video, canvas) {
  const width = 160;
  const height = 120;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(video, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);
  const gray = new Float32Array(width * height);

  let brightnessSum = 0;
  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    const luminance = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    gray[pixel] = luminance;
    brightnessSum += luminance;
  }

  let laplaceSum = 0;
  let laplaceSquaredSum = 0;
  let samples = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const center = gray[y * width + x];
      const laplace =
        gray[(y - 1) * width + x] +
        gray[(y + 1) * width + x] +
        gray[y * width + (x - 1)] +
        gray[y * width + (x + 1)] -
        4 * center;

      laplaceSum += laplace;
      laplaceSquaredSum += laplace * laplace;
      samples += 1;
    }
  }

  const laplaceMean = laplaceSum / Math.max(samples, 1);
  const sharpness =
    laplaceSquaredSum / Math.max(samples, 1) - laplaceMean * laplaceMean;

  return {
    brightness: brightnessSum / (width * height),
    sharpness,
  };
}

function blendshapeMap(result) {
  const categories = result?.faceBlendshapes?.[0]?.categories || [];
  const map = {};
  for (const item of categories) {
    map[item.categoryName] = item.score;
  }
  return map;
}

function landmarkBounds(landmarks) {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  for (const point of landmarks) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 0.0001),
    height: Math.max(maxY - minY, 0.0001),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function buildState(result, video, canvas) {
  const landmarks = result.faceLandmarks[0];
  const bounds = landmarkBounds(landmarks);
  const faceWidth = bounds.width;
  const faceHeight = bounds.height;

  const leftEyeCenter = averagePoint([landmarks[33], landmarks[133], landmarks[159], landmarks[145]]);
  const rightEyeCenter = averagePoint([landmarks[362], landmarks[263], landmarks[386], landmarks[374]]);
  const noseTip = landmarks[1];
  const leftFace = landmarks[234];
  const rightFace = landmarks[454];

  const yaw =
    (noseTip.x - (leftFace.x + rightFace.x) / 2) /
    Math.max(Math.abs(rightFace.x - leftFace.x), 0.0001);

  const roll =
    (rightEyeCenter.y - leftEyeCenter.y) /
    Math.max(distanceBetween(leftEyeCenter, rightEyeCenter), 0.0001);

  const blends = blendshapeMap(result);
  const eyeBlinkLeft = blends.eyeBlinkLeft ?? 0;
  const eyeBlinkRight = blends.eyeBlinkRight ?? 0;
  const blinkScore = Math.max(eyeBlinkLeft, eyeBlinkRight);

  const jawOpen = blends.jawOpen ?? 0;
  const mouthOpen = blends.mouthOpen ?? 0;
  const mouthGap =
    distanceBetween(landmarks[13], landmarks[14]) /
    Math.max(distanceBetween(landmarks[78], landmarks[308]), 0.0001);

  const mouthOpenScore = Math.max(jawOpen, mouthOpen, mouthGap);

  const { brightness, sharpness } = getFrameMetrics(video, canvas);

  return {
    descriptorReady: true,
    yaw,
    roll,
    blinkScore,
    mouthOpenScore,
    brightness,
    sharpness,
    faceWidthRatio: faceWidth,
    faceHeightRatio: faceHeight,
    boxCenterXRatio: bounds.centerX,
    boxCenterYRatio: bounds.centerY,
  };
}

function validateCommonState(state) {
  if (state.faceWidthRatio < MIN_FACE_WIDTH_RATIO || state.faceHeightRatio < MIN_FACE_HEIGHT_RATIO) {
    return "Move a bit closer to the camera.";
  }

  if (
    Math.abs(state.boxCenterXRatio - 0.5) > MAX_CENTER_OFFSET_RATIO ||
    Math.abs(state.boxCenterYRatio - 0.5) > MAX_CENTER_OFFSET_RATIO
  ) {
    return "Keep your face near the center of the frame.";
  }

  if (state.brightness < MIN_BRIGHTNESS) {
    return "Lighting is too dark.";
  }

  if (state.brightness > MAX_BRIGHTNESS) {
    return "Too much light or glare on the face.";
  }

  if (state.sharpness < MIN_SHARPNESS) {
    return "Image is blurry. Hold still for a moment.";
  }

  if (Math.abs(state.roll) > MAX_ROLL) {
    return "Keep your head more upright.";
  }

  if (state.blinkScore > EYES_OPEN_MAX_BLINK_SCORE) {
    return "Keep both eyes open.";
  }

  return null;
}

function validateFrontNeutral(state) {
  if (Math.abs(state.yaw) > FRONT_YAW_MAX) {
    return "Keep your face looking straight.";
  }

  if (state.mouthOpenScore > MOUTH_CLOSED_MAX) {
    return "Close your mouth and keep a neutral face.";
  }

  return null;
}

function validateSidePose(state, requiredSign = null) {
  if (Math.abs(state.yaw) < SIDE_YAW_MIN) {
    return {
      error: "Turn your face more clearly to one side.",
      sign: null,
    };
  }

  const detectedSign = state.yaw > 0 ? 1 : -1;

  if (requiredSign !== null && detectedSign !== requiredSign) {
    return {
      error: "Now turn to the opposite side.",
      sign: detectedSign,
    };
  }

  return {
    error: null,
    sign: detectedSign,
  };
}

export default function FaceCapturePanel({ mode = "register", onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);

  const [loadingEngine, setLoadingEngine] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [promptText, setPromptText] = useState("Align your face inside the frame");
  const [progressText, setProgressText] = useState("Preparing camera and face engine");
  const [validFrameCount, setValidFrameCount] = useState(0);

  const title = useMemo(() => {
    if (mode === "register") return "MediaPipe Secure Enrollment";
    if (mode === "reset") return "MediaPipe secure face reset";
    return "MediaPipe Secure Login";
  }, [mode]);

  const description = useMemo(() => {
    if (mode === "login") {
      return "";
    }
    return "";
  }, [mode]);

  useEffect(() => {
    analysisCanvasRef.current = document.createElement("canvas");
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_ROOT);

        let landmarker = null;
        try {
          landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MEDIAPIPE_MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 2,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            minFaceDetectionConfidence: 0.6,
            minFacePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        } catch (gpuError) {
          landmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MEDIAPIPE_MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 2,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            minFaceDetectionConfidence: 0.6,
            minFacePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        }

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(FACE_API_MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(FACE_API_MODEL_URL),
        ]);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          landmarker?.close?.();
          return;
        }

        faceLandmarkerRef.current = landmarker;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setLoadingEngine(false);
        setProgressText("Camera and MediaPipe engine ready.");
      } catch (error) {
        console.error(error);
        toast.error("MediaPipe engine or camera could not be loaded.");
        setLoadingEngine(false);
        setProgressText("MediaPipe engine failed to load.");
      }
    };

    boot();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (faceLandmarkerRef.current?.close) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    setValidFrameCount(0);
    if (mode === "login") {
      setPromptText("Look straight with eyes open");
      setProgressText("We will validate front face, ask you to open your mouth, then confirm front face again.");
    } else {
      setPromptText("Look straight with eyes open");
      setProgressText("We will validate front face, ask you to open your mouth, confirm front face, then collect side poses.");
    }
  }, [mode]);

  const detectMediaPipeState = async () => {
    const video = videoRef.current;
    const canvas = analysisCanvasRef.current;
    const landmarker = faceLandmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      return { error: "Camera is not ready yet." };
    }

    const result = landmarker.detectForVideo(video, performance.now());

    const faceCount = result?.faceLandmarks?.length || 0;
    if (faceCount === 0) {
      return { error: "No face detected in the frame." };
    }

    if (faceCount > 1) {
      return { error: "Only one face is allowed in the frame." };
    }

    return { state: buildState(result, video, canvas) };
  };

  const extractDescriptorSamples = async (sampleCount = 3) => {
    const video = videoRef.current;
    const samples = [];
    const startedAt = Date.now();

    while (Date.now() - startedAt < 7000 && samples.length < sampleCount) {
      const detection = await faceapi
        .detectSingleFace(video, FACE_API_DETECTOR)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection?.descriptor) {
        samples.push(Array.from(detection.descriptor));
      }

      await sleep(120);
    }

    if (samples.length < 2) {
      throw new Error("Could not generate a stable face template. Hold still and try again.");
    }

    return averageVectors(samples);
  };

  const collectNeutralFront = async ({ prompt }) => {
    setPromptText(prompt);
    setValidFrameCount(0);

    const mouthSamples = [];
    let valid = 0;
    let lastError = "Hold steady and look straight.";
    const startedAt = Date.now();

    while (Date.now() - startedAt < CAPTURE_TIMEOUT_MS) {
      const result = await detectMediaPipeState();

      if (result.error) {
        lastError = result.error;
        valid = 0;
        mouthSamples.length = 0;
        setValidFrameCount(0);
        setProgressText(lastError);
        await sleep(180);
        continue;
      }

      const state = result.state;
      const commonError = validateCommonState(state);
      const frontError = validateFrontNeutral(state);

      if (commonError || frontError) {
        lastError = commonError || frontError;
        valid = 0;
        mouthSamples.length = 0;
        setValidFrameCount(0);
        setProgressText(lastError);
        await sleep(180);
        continue;
      }

      valid += 1;
      mouthSamples.push(state.mouthOpenScore);
      setValidFrameCount(valid);
      setProgressText(`Collecting neutral front frames ${valid}/${REQUIRED_NEUTRAL_FRAMES}`);

      if (valid >= REQUIRED_NEUTRAL_FRAMES) {
        const descriptor = await extractDescriptorSamples(3);
        const mouthBaseline =
          mouthSamples.reduce((sum, value) => sum + value, 0) / mouthSamples.length;

        return {
          descriptor,
          mouthBaseline,
        };
      }

      await sleep(140);
    }

    throw new Error(lastError || "Front-face capture timed out.");
  };

  const collectOpenMouthChallenge = async ({ baseline }) => {
    setPromptText("Open your mouth clearly");
    setValidFrameCount(0);

    const threshold = Math.max(0.34, baseline + 0.15);
    let valid = 0;
    let lastError = "Open your mouth clearly while keeping your face straight.";
    const startedAt = Date.now();

    while (Date.now() - startedAt < CAPTURE_TIMEOUT_MS) {
      const result = await detectMediaPipeState();

      if (result.error) {
        lastError = result.error;
        valid = 0;
        setValidFrameCount(0);
        setProgressText(lastError);
        await sleep(180);
        continue;
      }

      const state = result.state;
      const commonError = validateCommonState(state);

      if (commonError) {
        lastError = commonError;
        valid = 0;
        setValidFrameCount(0);
        setProgressText(lastError);
        await sleep(180);
        continue;
      }

      if (Math.abs(state.yaw) > FRONT_YAW_MAX) {
        valid = 0;
        setValidFrameCount(0);
        setProgressText("Keep your face straight during the mouth-open challenge.");
        await sleep(160);
        continue;
      }

      if (state.mouthOpenScore < threshold) {
        valid = 0;
        setValidFrameCount(0);
        setProgressText("Open your mouth wider.");
        await sleep(160);
        continue;
      }

      valid += 1;
      setValidFrameCount(valid);
      setProgressText(`Mouth-open frames ${valid}/${REQUIRED_CHALLENGE_FRAMES}`);

      if (valid >= REQUIRED_CHALLENGE_FRAMES) {
        return true;
      }

      await sleep(140);
    }

    throw new Error(lastError || "Open-mouth challenge timed out.");
  };

  const collectSidePose = async ({ prompt, requiredSign = null }) => {
    setPromptText(prompt);
    setValidFrameCount(0);

    let valid = 0;
    let detectedSign = requiredSign;
    let lastError = "Turn your face more clearly.";
    const startedAt = Date.now();

    while (Date.now() - startedAt < CAPTURE_TIMEOUT_MS) {
      const result = await detectMediaPipeState();

      if (result.error) {
        lastError = result.error;
        valid = 0;
        setValidFrameCount(0);
        setProgressText(lastError);
        await sleep(180);
        continue;
      }

      const state = result.state;
      const commonError = validateCommonState(state);
      if (commonError) {
        lastError = commonError;
        valid = 0;
        setValidFrameCount(0);
        setProgressText(lastError);
        await sleep(180);
        continue;
      }

      const sideCheck = validateSidePose(state, detectedSign);
      if (sideCheck.error) {
        lastError = sideCheck.error;
        valid = 0;
        setValidFrameCount(0);
        setProgressText(lastError);
        await sleep(180);
        continue;
      }

      if (detectedSign === null) {
        detectedSign = sideCheck.sign;
      }

      valid += 1;
      setValidFrameCount(valid);
      setProgressText(`Collecting side frames ${valid}/${REQUIRED_NEUTRAL_FRAMES}`);

      if (valid >= REQUIRED_NEUTRAL_FRAMES) {
        const descriptor = await extractDescriptorSamples(3);
        return {
          descriptor,
          sign: detectedSign,
        };
      }

      await sleep(140);
    }

    throw new Error(lastError || "Side-face capture timed out.");
  };

  const runCapture = async () => {
    setCapturing(true);
    setValidFrameCount(0);

    try {
      const neutralOne = await collectNeutralFront({
        prompt: "Look straight with eyes open",
      });

      await collectOpenMouthChallenge({
        baseline: neutralOne.mouthBaseline,
      });

      const neutralTwo = await collectNeutralFront({
        prompt: "Close your mouth and look straight again",
      });

      if (mode === "login") {
        onCapture?.({
          descriptor: neutralTwo.descriptor,
          challengePassed: true,
        });
        toast.success("MediaPipe login capture passed.");
        setPromptText("Front-face verification completed");
        setProgressText("Login descriptor is ready.");
        return;
      }

      const firstSide = await collectSidePose({
        prompt: "Turn your face clearly to one side",
        requiredSign: null,
      });

      const secondSide = await collectSidePose({
        prompt: "Now turn your face to the opposite side",
        requiredSign: firstSide.sign === 1 ? -1 : 1,
      });

      const faceProfile =
        firstSide.sign < 0
          ? {
              center: neutralTwo.descriptor,
              left: firstSide.descriptor,
              right: secondSide.descriptor,
            }
          : {
              center: neutralTwo.descriptor,
              left: secondSide.descriptor,
              right: firstSide.descriptor,
            };

      onCapture?.({
        descriptor: neutralTwo.descriptor,
        faceProfile,
        challengePassed: true,
      });

      toast.success(
        mode === "reset"
          ? "New face profile captured with MediaPipe."
          : "Face profile captured with MediaPipe."
      );
      setPromptText("Enrollment completed");
      setProgressText("Front and side captures completed successfully.");
    } catch (error) {
      toast.error(error.message || "Secure face capture failed.");
      setProgressText(error.message || "Secure face capture failed.");
    } finally {
      setCapturing(false);
      setValidFrameCount(0);
    }
  };

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyanGlow/70">
            Biometric access
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <div className="rounded-2xl bg-cyanGlow/10 p-3 text-cyanGlow">
          <ScanFace size={22} />
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ShieldAlert size={16} />
            MediaPipe liveness checks
          </div>
          <p className="leading-6">
            No face, multiple faces, blur, bad lighting, off-center framing, closed eyes, and weak side turns are rejected before a template is generated.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} />
            Stable challenge flow
          </div>
          <p className="leading-6">
            The challenge is now neutral front face, open mouth clearly, neutral confirmation, and side poses for enrollment or reset.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => setCameraReady(true)}
          className="aspect-[4/3] w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 border-[3px] border-dashed border-cyanGlow/35" />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">{promptText}</p>
              <p className="mt-1 text-xs text-slate-300">{progressText}</p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
              {cameraReady ? "Live camera" : "Preparing camera"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={runCapture} disabled={loadingEngine || capturing || !cameraReady}>
          {loadingEngine ? (
            <>
              <LoaderCircle className="mr-2 animate-spin" size={16} />
              Loading MediaPipe
            </>
          ) : capturing ? (
            <>
              <LoaderCircle className="mr-2 animate-spin" size={16} />
              Validating live face
            </>
          ) : (
            <>
              <Camera className="mr-2" size={16} />
              {mode === "login" ? "Run secure login capture" : "Run secure enrollment capture"}
            </>
          )}
        </Button>

        <Button
          variant="dark"
          onClick={() => {
            setPromptText("Look straight with eyes open");
            setProgressText(
              mode === "login"
                ? "We will validate front face, ask you to open your mouth, then confirm front face again."
                : "We will validate front face, ask you to open your mouth, confirm front face, then collect side poses."
            );
            setValidFrameCount(0);
            toast("Capture guidance reset.");
          }}
        >
          <RotateCcw className="mr-2" size={16} />
          Reset guidance
        </Button>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-cyanGlow/20 bg-cyanGlow/10 px-4 py-2 text-sm text-cyanGlow">
          <CheckCircle2 size={16} />
          Valid frames: {validFrameCount}
        </div>
      </div>
    </div>
  );
}