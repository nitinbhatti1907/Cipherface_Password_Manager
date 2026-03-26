import { motion } from "framer-motion";
import { ArrowRight, Camera, ShieldCheck } from "lucide-react";
import Button from "./Button";

export default function HeroSection({ onScrollToAuth }) {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="grid-glow absolute inset-0 opacity-25" />

      <div className="relative mx-auto max-w-5xl px-6 py-20 text-center lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-cyanGlow/20 bg-cyanGlow/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyanGlow"
        >
          <ShieldCheck size={14} />
          Secure face-based access
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl"
        >
          CipherFace keeps your vault access simple and secure.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg"
        >
          Register or log in using face recognition, then manage your encrypted credentials in one clean experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Button onClick={onScrollToAuth}>
            Login / Register
            <ArrowRight className="ml-2" size={16} />
          </Button>

          <Button variant="dark">
            <Camera className="mr-2" size={16} />
            Face recognition enabled
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300"
        >
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            Encrypted vault
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            Secure login
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            Password tools
          </span>
        </motion.div>
      </div>
    </section>
  );
}