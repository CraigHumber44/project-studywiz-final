"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { addFile, getFile, listFiles, removeFile } from "@/lib/libraryDb";

type LibraryRow = {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: number;
};

type SavedNote = {
    id: string;
    content: string;
    createdAt: number;
};

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
}

function formatDate(ms: number) {
    return new Date(ms).toLocaleString();
}

function shortDate(ms: number) {
    return new Date(ms).toLocaleDateString();
}

function makeId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function noteTitle(content: string) {
    const clean = content.replace(/\s+/g, " ").trim();
    if (!clean) return "Your Note...";
    const words = clean.split(" ").slice(0, 4).join(" ");
    return `${words}...`;
}

function normEmail(email?: string) {
    return String(email || "").trim().toLowerCase();
}

function notesKeyFor(email?: string) {
    const k = normEmail(email);
    return `studywiz_material_notes_list:${k || "unknown"}`;
}

export default function MaterialsPage() {
    const { user } = useApp();

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [rows, setRows] = useState<LibraryRow[]>([]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string>("");

    // Notes (manual save)
    const [draftNote, setDraftNote] = useState("");
    const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
    const [openNote, setOpenNote] = useState<SavedNote | null>(null);

    // Upload UI
    const [pickedNames, setPickedNames] = useState<string>("");

    const ownerKey = useMemo(() => normEmail(user?.email), [user?.email]);
    const NOTES_KEY = useMemo(() => notesKeyFor(user?.email), [user?.email]);

    useEffect(() => {
        // Reset page state when user changes
        setDraftNote("");
        setOpenNote(null);
        setPickedNames("");
        setMsg("");

        // Only load device data when user is logged in
        if (!user || !ownerKey) {
            setRows([]);
            setSavedNotes([]);
            return;
        }

        refreshFiles();

        const saved = window.localStorage.getItem(NOTES_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSavedNotes(Array.isArray(parsed) ? parsed : []);
            } catch {
                setSavedNotes([]);
            }
        } else {
            setSavedNotes([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.email, ownerKey, NOTES_KEY]);

    async function refreshFiles() {
        if (!ownerKey) return;
        try {
            const files = await listFiles(ownerKey);
            setRows(files);
        } catch {
            setRows([]);
        }
    }

    function flash(message: string, ms = 1400) {
        setMsg(message);
        window.setTimeout(() => setMsg(""), ms);
    }

    function saveNote() {
        if (!ownerKey) return;

        const content = draftNote.trim();
        if (!content) return;

        const next: SavedNote = {
            id: makeId(),
            content,
            createdAt: Date.now(),
        };

        const updated = [next, ...savedNotes]; // newest first
        setSavedNotes(updated);
        window.localStorage.setItem(NOTES_KEY, JSON.stringify(updated));

        setDraftNote("");
        flash("Note saved.", 1200);
    }

    function viewNote(note: SavedNote) {
        setOpenNote(note);
    }

    function downloadNote(note: SavedNote) {
        const blob = new Blob([note.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${noteTitle(note.content).replace("...", "")}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
    }

    async function removeNote(id: string) {
        if (!ownerKey) return;

        const ok = window.confirm("Remove this note?");
        if (!ok) return;

        const updated = savedNotes.filter((n) => n.id !== id);
        setSavedNotes(updated);
        window.localStorage.setItem(NOTES_KEY, JSON.stringify(updated));

        setOpenNote((prev) => (prev?.id === id ? null : prev));
        flash("Note removed.", 1200);
    }

    function openPicker() {
        fileInputRef.current?.click();
    }

    async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!ownerKey) return;

        const files = e.target.files;
        if (!files || files.length === 0) return;

        setBusy(true);
        setMsg("");

        try {
            for (const f of Array.from(files)) {
                await addFile(f, ownerKey);
            }
            await refreshFiles();
            flash("Upload complete.");
        } catch {
            flash("Upload failed.");
        } finally {
            setBusy(false);

            // Clear native input and custom filename display
            e.target.value = "";
            setPickedNames("");
        }
    }

    async function onDownloadFile(id: string) {
        if (!ownerKey) return;

        setBusy(true);
        setMsg("");

        try {
            const file = await getFile(id, ownerKey);
            if (!file) {
                flash("File not found.");
                return;
            }

            const url = URL.createObjectURL(file.blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            flash("Download failed.");
        } finally {
            setBusy(false);
        }
    }

    async function onRemoveFile(id: string) {
        if (!ownerKey) return;

        const ok = window.confirm("Remove this item from your library?");
        if (!ok) return;

        setBusy(true);
        setMsg("");

        try {
            await removeFile(id, ownerKey);
            await refreshFiles();
            flash("Removed.");
        } catch {
            flash("Remove failed.");
        } finally {
            setBusy(false);
        }
    }

    const totalFileSize = useMemo(() => rows.reduce((acc, r) => acc + (r.size || 0), 0), [rows]);

    if (!user) {
        return (
            <div className="materials-page">
                <h1 className="materials-title">Materials</h1>
                <p className="materials-subtitle">Login required to use Materials.</p>
                <div className="materials-empty">Please login to access notes and your study library.</div>
            </div>
        );
    }

    return (
        <div className="materials-page">
            <h1 className="materials-title">Materials</h1>
            <p className="materials-subtitle">Your personal library, notes and uploaded files are saved on this device.</p>

            {msg ? <div className="materials-msg">{msg}</div> : null}

            <div className="materials-grid">
                {/* NOTES */}
                <section className="materials-card">
                    <h2 className="materials-card-title">Notes</h2>
                    <p className="materials-card-hint">Write a note and save it manually. Saved notes appear below.</p>

                    <textarea
                        className="materials-notes"
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        placeholder="Write your note here..."
                        rows={8}
                        disabled={busy}
                    />

                    <div className="materials-notes-actions">
                        <button className="materials-btn primary" onClick={saveNote} disabled={busy || !draftNote.trim()}>
                            Save Note
                        </button>
                    </div>

                    {savedNotes.length === 0 ? (
                        <div className="materials-empty">No saved notes yet.</div>
                    ) : (
                        <div className="materials-list">
                            {savedNotes.map((n) => (
                                <div key={n.id} className="materials-item">
                                    <div className="materials-item-main">
                                        <div className="materials-item-name">{noteTitle(n.content)}</div>
                                        <div className="materials-item-sub">{shortDate(n.createdAt)}</div>
                                    </div>

                                    <div className="materials-item-actions">
                                        <button className="materials-btn" onClick={() => viewNote(n)} disabled={busy}>
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* FILE LIBRARY */}
                <section className="materials-card">
                    <h2 className="materials-card-title">Study Library</h2>
                    <p className="materials-card-hint">
                        Save your local disc space: Upload PDFs, images, docs, or any file you study with. You can access, or
                        download them anytime.
                    </p>

                    {/* Hidden native input (removes "no file chosen" UI) */}
                    <input
                        ref={fileInputRef}
                        className="materials-file-input-hidden"
                        type="file"
                        multiple
                        onChange={(e) => {
                            const names = e.target.files?.length
                                ? Array.from(e.target.files)
                                    .map((f) => f.name)
                                    .slice(0, 4)
                                    .join(", ") +
                                (e.target.files && e.target.files.length > 4
                                    ? ` (+${e.target.files.length - 4} more)`
                                    : "")
                                : "";
                            setPickedNames(names);
                            onUpload(e);
                        }}
                        disabled={busy}
                    />

                    <div className="materials-upload-row">
                        <button className="materials-btn" onClick={openPicker} disabled={busy}>
                            Upload Files
                        </button>

                        <div className="materials-picked">{pickedNames ? pickedNames : ""}</div>

                        <div className="materials-stats">
                            <div>{rows.length} items</div>
                            <div>{formatBytes(totalFileSize)} stored</div>
                        </div>
                    </div>

                    {rows.length === 0 ? (
                        <div className="materials-empty">No uploaded materials yet.</div>
                    ) : (
                        <div className="materials-list">
                            {rows.map((r) => (
                                <div key={r.id} className="materials-item">
                                    <div className="materials-item-main">
                                        <div className="materials-item-name">{r.name}</div>
                                        <div className="materials-item-meta">
                                            <span>{formatBytes(r.size)}</span>
                                            <span className="dot"> • </span>
                                            <span>{formatDate(r.uploadedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="materials-item-actions">
                                        <button className="materials-btn primary" onClick={() => onDownloadFile(r.id)} disabled={busy}>
                                            Download
                                        </button>
                                        <button className="materials-btn danger" onClick={() => onRemoveFile(r.id)} disabled={busy}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Detached Note popup */}
            {openNote ? (
                <div className="note-popup">
                    <div className="note-popup-head">
                        <div className="note-popup-title">{noteTitle(openNote.content)}</div>
                        <button className="note-popup-close" onClick={() => setOpenNote(null)}>
                            Close Note
                        </button>
                    </div>

                    <div className="note-popup-meta">{formatDate(openNote.createdAt)}</div>

                    <div className="note-popup-body">{openNote.content}</div>

                    <div className="note-popup-actions">
                        <button className="materials-btn" onClick={() => downloadNote(openNote)} disabled={busy}>
                            Download
                        </button>
                        <button className="materials-btn danger" onClick={() => removeNote(openNote.id)} disabled={busy}>
                            Remove
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
