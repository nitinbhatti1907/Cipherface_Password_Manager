import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import FaceCapturePanel from "./FaceCapturePanel";
import Button from "./Button";

const defaultRegister = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
};

const defaultLogin = {
  email: "",
};

const defaultReset = {
  email: "",
  password: "",
};

function getErrorDetail(error) {
  return error?.response?.data?.detail;
}

function getErrorMessage(detail, fallback) {
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  return fallback;
}

export default function AuthCard() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tab, setTab] = useState("register");
  const [registerData, setRegisterData] = useState(defaultRegister);
  const [loginData, setLoginData] = useState(defaultLogin);
  const [resetData, setResetData] = useState(defaultReset);

  const [registerFace, setRegisterFace] = useState(null);
  const [loginFace, setLoginFace] = useState(null);
  const [resetFace, setResetFace] = useState(null);

  const [busyAction, setBusyAction] = useState("");
  const [loginFailures, setLoginFailures] = useState(0);
  const [resetMode, setResetMode] = useState(false);

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setResetMode(false);
    setRegisterFace(null);
    setLoginFace(null);
    setResetFace(null);
  };

  const handleRegister = async () => {
    if (
      !registerData.full_name ||
      !registerData.email ||
      !registerData.password ||
      !registerData.confirm_password ||
      !registerFace?.faceProfile
    ) {
      toast.error("Complete all fields and finish the strict three-pose face capture.");
      return;
    }

    setBusyAction("register");
    try {
      const { data } = await api.post("/auth/register", {
        ...registerData,
        face_profile: registerFace.faceProfile,
        challenge_passed: registerFace.challengePassed,
      });

      login(data.access_token, data.user);
      toast.success("Registration completed with secure face enrollment.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(getErrorMessage(getErrorDetail(error), "Registration failed."));
    } finally {
      setBusyAction("");
    }
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginFace?.descriptor) {
      toast.error("Enter email and complete the strict front-face login capture.");
      return;
    }

    setBusyAction("login");
    try {
      const { data } = await api.post("/auth/login", {
        ...loginData,
        descriptor: loginFace.descriptor,
        challenge_passed: loginFace.challengePassed,
      });

      setLoginFailures(0);
      setResetMode(false);
      setResetFace(null);
      login(data.access_token, data.user);
      toast.success("Secure face login successful.");
      navigate("/dashboard");
    } catch (error) {
      const detail = getErrorDetail(error);
      const failedAttempts =
        typeof detail === "object" && detail?.failed_attempts ? detail.failed_attempts : 0;

      if (failedAttempts) {
        setLoginFailures(failedAttempts);
      }

      if (typeof detail === "object" && detail?.allow_face_reset) {
        setResetData((prev) => ({ ...prev, email: loginData.email || prev.email }));
      }

      toast.error(getErrorMessage(detail, "Login failed."));
    } finally {
      setBusyAction("");
    }
  };

  const handleResetFace = async () => {
    if (!resetData.email || !resetData.password || !resetFace?.faceProfile) {
      toast.error("Enter email, password, and finish the strict three-pose reset capture.");
      return;
    }

    setBusyAction("reset");
    try {
      const { data } = await api.post("/auth/reset-face", {
        ...resetData,
        face_profile: resetFace.faceProfile,
        challenge_passed: resetFace.challengePassed,
      });

      setLoginFailures(0);
      setResetMode(false);
      setResetFace(null);
      setLoginFace(null);
      setLoginData({ email: resetData.email });

      toast.success(data.message || "Face data reset successfully.");
    } catch (error) {
      toast.error(getErrorMessage(getErrorDetail(error), "Face reset failed."));
    } finally {
      setBusyAction("");
    }
  };

  const resetAvailable = loginFailures >= 3;
  const currentCaptureMode = tab === "register" ? "register" : resetMode ? "reset" : "login";

  return (
    <div className="panel mx-auto max-w-6xl overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-white/10 bg-white/5 p-6 lg:border-b-0 lg:border-r lg:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyanGlow/70">Secure access</p>

          <h2 className="mt-3 text-3xl font-bold text-white">
            {tab === "register"
              ? "Register with strict face enrollment"
              : resetMode
              ? "Reset face data securely"
              : "Login with strict front-face verification"}
          </h2>

          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
            Registration and face reset require front-face blink plus two opposite side captures. Login uses front-face capture only, but still blocks weak lighting, blur, closed eyes, and photo-like static capture.
          </p>

          <div className="mt-6 flex gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-2">
            {[
              ["register", "Register"],
              ["login", "Login"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  tab === key ? "bg-cyanGlow text-slate-950" : "text-slate-300 hover:bg-white/5"
                }`}
                onClick={() => handleTabChange(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {tab === "register" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Full name</label>
                  <input
                    value={registerData.full_name}
                    onChange={(e) =>
                      setRegisterData((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Password</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                    placeholder="Create a password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Confirm password</label>
                  <input
                    type="password"
                    value={registerData.confirm_password}
                    onChange={(e) =>
                      setRegisterData((prev) => ({ ...prev, confirm_password: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                    placeholder="Confirm your password"
                  />
                </div>

                <div className="rounded-2xl border border-cyanGlow/20 bg-cyanGlow/10 px-4 py-3 text-sm text-cyanGlow">
                  Registration will not complete unless the strict three-pose face capture succeeds.
                </div>

                <Button className="w-full" onClick={handleRegister} disabled={Boolean(busyAction)}>
                  {busyAction === "register" ? "Creating account..." : "Create account"}
                </Button>
              </>
            ) : resetMode ? (
              <>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    value={resetData.email}
                    onChange={(e) =>
                      setResetData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                    placeholder="Enter registered email"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Password</label>
                  <input
                    type="password"
                    value={resetData.password}
                    onChange={(e) =>
                      setResetData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                  Reset requires email, password, and a fresh strict three-pose face capture.
                </div>

                <Button className="w-full" onClick={handleResetFace} disabled={Boolean(busyAction)}>
                  {busyAction === "reset" ? "Resetting face data..." : "Save new face data"}
                </Button>

                <Button
                  className="w-full"
                  variant="dark"
                  onClick={() => {
                    setResetMode(false);
                    setResetFace(null);
                  }}
                  disabled={Boolean(busyAction)}
                >
                  Cancel reset
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="rounded-2xl border border-cyanGlow/20 bg-cyanGlow/10 px-4 py-3 text-sm text-cyanGlow">
                  Login uses front-face capture only, but eyes must be open and a real blink is required before the descriptor is accepted.
                </div>

                <Button className="w-full" onClick={handleLogin} disabled={Boolean(busyAction)}>
                  {busyAction === "login" ? "Verifying face..." : "Log in securely"}
                </Button>

                {loginFailures > 0 && (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                    Failed face attempts: {loginFailures}
                    {loginFailures < 3
                      ? ` - ${3 - loginFailures} more attempt(s) until face reset becomes available.`
                      : ""}
                  </div>
                )}

                {resetAvailable && (
                  <Button
                    className="w-full"
                    variant="dark"
                    onClick={() => {
                      setResetMode(true);
                      setResetData((prev) => ({
                        ...prev,
                        email: loginData.email || prev.email,
                      }));
                    }}
                    disabled={Boolean(busyAction)}
                  >
                    Reset face data
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <FaceCapturePanel
            mode={currentCaptureMode}
            onCapture={(payload) => {
              if (currentCaptureMode === "register") {
                setRegisterFace(payload);
              } else if (currentCaptureMode === "reset") {
                setResetFace(payload);
              } else {
                setLoginFace(payload);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}