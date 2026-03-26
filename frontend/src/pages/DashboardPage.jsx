import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  Clock3,
  LogOut,
  Plus,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import useIdleLogout from "../hooks/useIdleLogout";
import Button from "../components/Button";
import VaultTable from "../components/VaultTable";
import CredentialModal from "../components/CredentialModal";
import AuditLogList from "../components/AuditLogList";

function StatCard({ label, value, helper }) {
  return (
    <div className="panel panel-hover p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

function SecurityFeature({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 inline-flex rounded-2xl bg-cyanGlow/10 p-2 text-cyanGlow">
        {icon}
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function SnapshotCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white break-words">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState([]);
  const [logs, setLogs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: credentialsData }, { data: logsData }] = await Promise.all([
        api.get("/credentials"),
        api.get("/audit-logs"),
      ]);
      setCredentials(credentialsData.items || []);
      setLogs(logsData.items || []);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleIdleLogout = useCallback(async () => {
    toast("Session ended due to inactivity.");
    await logout();
    navigate("/");
  }, [logout, navigate]);

  const secondsLeft = useIdleLogout({
    enabled: true,
    onIdle: handleIdleLogout,
  });

  const stats = useMemo(
    () => [
      ["Vault entries", credentials.length, "Encrypted credentials under your account"],
      ["Audit events", logs.length, "Recorded activity for traceability"],
      [
        "Auto logout",
        `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`,
        "Remaining idle session time",
      ],
    ],
    [credentials.length, logs.length, secondsLeft]
  );

  const latestLog = logs[0];

  const latestLogTitle = latestLog?.action
    ? latestLog.action.replaceAll("_", " ")
    : "No recent event";

  const latestLogTime = latestLog?.created_at
    ? new Date(latestLog.created_at).toLocaleString()
    : "Waiting for activity";

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.site_name}?`)) return;

    try {
      await api.delete(`/credentials/${item.id}`);
      toast.success("Credential deleted.");
      loadData();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Could not delete credential.");
    }
  };

  return (
    <div className="min-h-screen bg-hero pb-16 text-white">
      <header className="border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyanGlow/10 text-cyanGlow shadow-glow">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyanGlow/70">
                Secure dashboard
              </p>
              <h1 className="text-2xl font-bold text-white">
                Welcome, {user?.full_name || user?.email}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:block">
              Session locks after inactivity
            </div>
            <Button
              variant="dark"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
            >
              <LogOut className="mr-2" size={16} />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="panel overflow-hidden p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyanGlow/70">
                  Security posture
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">Protected workspace</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                  Your vault uses encrypted storage, biometric sign-in, audit history, and
                  auto-logout. This dashboard is designed to stay clean, readable, and practical
                  while giving you quick visibility into your current session.
                </p>
              </div>
              <div className="rounded-2xl bg-cyanGlow/10 p-4 text-cyanGlow">
                <Sparkles size={22} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <SecurityFeature
                icon={<ScanFace size={18} />}
                title="Biometric access"
                text="Face login protects entry into your password vault."
              />
              <SecurityFeature
                icon={<ShieldCheck size={18} />}
                title="Encrypted storage"
                text="Credential records stay protected inside your account workspace."
              />
              <SecurityFeature
                icon={<Clock3 size={18} />}
                title="Idle protection"
                text="Sessions automatically close after inactivity to reduce risk."
              />
            </div>

           
          </div>

          <div className="grid gap-5">
            {stats.map(([label, value, helper]) => (
              <StatCard key={label} label={label} value={value} helper={helper} />
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <VaultTable
              items={credentials}
              onAdd={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
              onEdit={(item) => {
                setEditingItem(item);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          </div>
          <AuditLogList logs={logs} />
        </div>

        {loading && <p className="mt-5 text-sm text-slate-400">Refreshing encrypted data...</p>}
      </main>

      <CredentialModal
        open={modalOpen}
        editingItem={editingItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSaved={loadData}
      />
    </div>
  );
}