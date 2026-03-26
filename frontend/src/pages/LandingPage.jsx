import { useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  KeyRound,
  Lock,
  Plus,
  Shield,
  TimerReset,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AuthCard from "../components/AuthCard";

export default function LandingPage() {
  const authRef = useRef(null);
  const [showMore, setShowMore] = useState(false);

  const scrollToAuth = () => {
    authRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const features = [
    {
      icon: Fingerprint,
      title: "Face enrollment + login",
      description: "Register and verify using a camera-driven biometric workflow.",
    },
    {
      icon: Lock,
      title: "Encrypted credential vault",
      description: "Passwords are encrypted before storage in the Python backend.",
    },
    {
      icon: KeyRound,
      title: "Password tools",
      description: "Check password strength and generate stronger passwords quickly.",
    },
    {
      icon: Activity,
      title: "Audit logs",
      description: "Track major actions like registration, login, logout, and vault activity.",
    },
    {
      icon: TimerReset,
      title: "Auto logout",
      description: "Sessions expire after inactivity for better protection.",
    },
    {
      icon: Shield,
      title: "Rate limiting and lockout",
      description: "Repeated failed login attempts trigger temporary protection.",
    },
  ];

  return (
    <div className="min-h-screen bg-abyss text-white">
      <Navbar onScrollToAuth={scrollToAuth} />
      <HeroSection onScrollToAuth={scrollToAuth} />

      <section className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <button
            type="button"
            onClick={() => setShowMore((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyanGlow/40 hover:bg-white/10"
          >
            <Plus size={16} className={showMore ? "hidden" : "block"} />
            {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showMore ? "Hide details" : "More about CipherFace"}
          </button>

          <AnimatePresence initial={false}>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-6 grid gap-4 text-left md:grid-cols-2">
                  {features.map(({ icon: Icon, title, description }) => (
                    <div
                      key={title}
                      className="panel panel-hover rounded-3xl p-5 transition duration-300"
                    >
                      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyanGlow/10 text-cyanGlow">
                        <Icon size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section ref={authRef} className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <AuthCard />
      </section>
    </div>
  );
}