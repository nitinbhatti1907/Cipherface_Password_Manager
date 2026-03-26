import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "./Button";

export default function VaultTable({ items, onAdd, onEdit, onDelete }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyanGlow/70">Encrypted vault</p>
          <h3 className="mt-2 text-xl font-bold text-white">Stored credentials</h3>
        </div>
        <Button onClick={onAdd}>
          <Plus className="mr-2" size={16} />
          Add entry
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
            <tr>
              <th className="px-6 py-4">Site</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">URL</th>
              <th className="px-6 py-4">Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id} className="border-t border-white/10 text-sm text-slate-200 transition hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-white">{item.site_name}</p>
                      <p className="mt-1 text-xs text-slate-400">Encrypted at rest</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{item.username}</td>
                  <td className="px-6 py-4">
                    <a className="text-cyanGlow hover:underline" href={item.site_url} target="_blank" rel="noreferrer">
                      {item.site_url || "-"}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{new Date(item.updated_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-xl bg-white/5 p-2 transition hover:bg-white/10" title="View">
                        <Eye size={16} />
                      </button>
                      <button
                        className="rounded-xl bg-white/5 p-2 transition hover:bg-white/10"
                        title="Edit"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="rounded-xl bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                        title="Delete"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                  No credentials yet. Add your first secure vault entry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
