import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import Button from "./Button";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

const emptyForm = {
  site_name: "",
  site_url: "",
  username: "",
  password: "",
  notes: "",
};

export default function CredentialModal({ open, onClose, onSaved, editingItem }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (editingItem) {
      setForm({
        site_name: editingItem.site_name || "",
        site_url: editingItem.site_url || "",
        username: editingItem.username || "",
        password: editingItem.password || "",
        notes: editingItem.notes || "",
      });
      setAnalysis(null);
    } else {
      setForm(emptyForm);
      setAnalysis(null);
    }
  }, [editingItem, open]);

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const analyzePassword = async () => {
    if (!form.password) {
      toast.error("Enter a password first.");
      return;
    }
    const { data } = await api.post("/password/strength", { password: form.password });
    setAnalysis(data);
  };

  const generatePassword = async () => {
    const { data } = await api.post("/password/generate", { length: 18, include_symbols: true });
    updateField("password", data.password);
    setAnalysis(data.analysis);
    toast.success("Strong password generated.");
  };

  const saveCredential = async () => {
    setLoading(true);
    try {
      if (editingItem?.id) {
        await api.put(`/credentials/${editingItem.id}`, form);
        toast.success("Credential updated.");
      } else {
        await api.post("/credentials", form);
        toast.success("Credential saved securely.");
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Could not save credential.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="panel max-h-[92vh] w-full max-w-3xl overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyanGlow/70">Vault editor</p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {editingItem ? "Edit credential" : "Add credential"}
            </h3>
          </div>
          <Button variant="dark" onClick={onClose}>Close</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["site_name", "Site name", "example.com"],
            ["site_url", "URL", "https://example.com"],
            ["username", "Username", "your username"],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="mb-2 block text-sm text-slate-300">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
                placeholder="Encrypted before storage"
              />
              <Button variant="dark" onClick={analyzePassword}>Analyze</Button>
              <Button onClick={generatePassword}>Generate</Button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Notes</label>
            <textarea
              rows="4"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyanGlow/40"
              placeholder="Optional notes"
            />
          </div>
          <div className="md:col-span-2"> 
            <PasswordStrengthMeter analysis={analysis} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="dark" onClick={onClose}>Cancel</Button>
          <Button onClick={saveCredential} disabled={loading}>
            {loading ? "Saving..." : editingItem ? "Update credential" : "Save credential"}
          </Button>
        </div>
      </div>
    </div>
  );
}
