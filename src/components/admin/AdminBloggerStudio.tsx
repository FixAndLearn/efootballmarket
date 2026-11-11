"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { NewsArticle, NewsCategory } from "@/types/database";
import { getCategoryLabel } from "@/lib/data/editorialGuides";
import { Button } from "@/components/ui/Button";
import {
  Bold,
  BookOpen,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  List,
  Pin,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

interface AdminBloggerStudioProps {
  articles: NewsArticle[];
  onRefresh: () => void;
  onFeedback: (fb: { type: "success" | "error"; message: string } | null) => void;
}

const PRESET_COVERS = [
  { label: "Night Stadium", url: "/images/articles/live-update-condition-night.jpg" },
  { label: "Team Tactics", url: "/images/articles/team-playstyles-stadium.jpg" },
  { label: "Konami 2FA", url: "/images/articles/konami-id-two-step-pin.jpg" },
  { label: "M-Pesa Escrow", url: "/images/articles/mpesa-escrow-payment.jpg" },
  { label: "Mobile 60 FPS", url: "/images/articles/mobile-60fps-gaming.jpg" },
  { label: "Scam Alert", url: "/images/articles/whatsapp-scam-protection.jpg" },
];

export function AdminBloggerStudio({
  articles,
  onRefresh,
  onFeedback,
}: AdminBloggerStudioProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<NewsCategory>("update");
  const [authorName, setAuthorName] = useState("eFootballMarket Editorial Desk");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [broadcastNotif, setBroadcastNotif] = useState(true);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<string>("all");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const inlineImgInputRef = useRef<HTMLInputElement | null>(null);

  const isStaticGuide = (id: string) =>
    id.startsWith("guide-") || id.startsWith("update-");

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("update");
    setAuthorName("eFootballMarket Editorial Desk");
    setCoverImageUrl("");
    setSummary("");
    setContent("");
    setIsPinned(false);
    setBroadcastNotif(true);
    setEditorMode("write");
  };

  const handleLoadForEdit = (article: NewsArticle) => {
    if (isStaticGuide(article.id)) {
      // Clone built-in guide as a fresh editable database post with same slug override
      setEditingId(null);
    } else {
      setEditingId(article.id);
    }
    setTitle(article.title);
    setCategory(article.category);
    setAuthorName(article.author_name || "eFootballMarket Editorial Desk");
    setCoverImageUrl(article.cover_image_url || "");
    setSummary(article.summary);
    setContent(article.content);
    setIsPinned(Boolean(article.is_pinned));
    setEditorMode("write");
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const insertSnippet = (before: string, after = "") => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => `${prev}${before}${after}`);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const selected = content.slice(start, end) || "text";
    const updated =
      content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(updated);
    setTimeout(() => {
      el.focus();
      const cursor = start + before.length + selected.length + after.length;
      el.setSelectionRange(cursor, cursor);
    }, 10);
  };

  const uploadImageFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Image upload failed");
    }
    return data.url || null;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    onFeedback(null);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        setCoverImageUrl(url);
        onFeedback({ type: "success", message: "Cover photo uploaded!" });
      }
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleInlineImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInline(true);
    onFeedback(null);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        setContent(
          (prev) => `${prev ? `${prev}\n\n` : ""}![eFootball Guide Screenshot](${url})\n`
        );
        onFeedback({
          type: "success",
          message: "Screenshot inserted into blog body!",
        });
      }
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    } finally {
      setUploadingInline(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    onFeedback(null);

    try {
      if (editingId) {
        const res = await fetch("/api/news", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            title,
            category,
            summary,
            content,
            cover_image_url: coverImageUrl || null,
            author_name: authorName,
            is_pinned: isPinned,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update post");

        onFeedback({
          type: "success",
          message: "Blog post updated successfully!",
        });
      } else {
        const res = await fetch("/api/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            category,
            summary,
            content,
            cover_image_url: coverImageUrl || undefined,
            author_name: authorName || "eFootballMarket Editorial Desk",
            is_pinned: isPinned,
            broadcastNotification: broadcastNotif,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to publish post");

        onFeedback({
          type: "success",
          message: broadcastNotif
            ? "Blog post published & community notified!"
            : "Blog post published live to /news and /blog!",
        });
      }

      resetForm();
      onRefresh();
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (article: NewsArticle) => {
    if (isStaticGuide(article.id)) {
      onFeedback({
        type: "error",
        message: "Click Edit to customize & pin a built-in guide in the database.",
      });
      return;
    }
    try {
      const res = await fetch("/api/news", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: article.id,
          is_pinned: !article.is_pinned,
        }),
      });
      if (res.ok) {
        onFeedback({
          type: "success",
          message: !article.is_pinned
            ? "Pinned as Featured Spotlight!"
            : "Unpinned post.",
        });
        onRefresh();
      }
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    }
  };

  const handleDelete = async (article: NewsArticle) => {
    if (isStaticGuide(article.id)) {
      onFeedback({
        type: "error",
        message: "Built-in evergreen reference guides stay live automatically.",
      });
      return;
    }
    if (!confirm(`Delete "${article.title}" permanently?`)) return;
    try {
      const res = await fetch(`/api/news?id=${article.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (editingId === article.id) resetForm();
        onFeedback({ type: "success", message: "Blog post deleted." });
        onRefresh();
      }
    } catch (err: any) {
      onFeedback({ type: "error", message: err.message });
    }
  };

  const filteredLibrary = useMemo(() => {
    if (libraryFilter === "all") return articles;
    if (libraryFilter === "upcoming") {
      return articles.filter(
        (a) => a.category === "update" || a.category === "announcement"
      );
    }
    return articles.filter((a) => a.category === libraryFilter);
  }, [articles, libraryFilter]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sx-border pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-sx-green-text mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Blogger &amp; Editorial Studio</span>
          </span>
          <h2 className="text-2xl font-bold text-sx-ink font-display">
            Publish Guides, Meta Breakdowns &amp; Upcoming Updates
          </h2>
          <p className="text-xs text-sx-muted mt-0.5">
            Write posts about upcoming eFootball packs, new platform features, Konami ID guides, or scammer advisories—and optionally notify all users.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {editingId && (
            <Button variant="outline" size="sm" onClick={resetForm}>
              <Plus className="w-3.5 h-3.5" />
              <span>New Post</span>
            </Button>
          )}
          <Link href="/news" target="_blank">
            <Button variant="outline" size="sm">
              <span>View Live Blog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: BLOGGER COMPOSER */}
        <div className="lg:col-span-7 rounded-2xl bg-sx-subtle border border-sx-border p-5 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-sx-ink font-display flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sx-green-text" />
                <span>
                  {editingId ? "Editing Published Blog Post" : "Create New Blog Post"}
                </span>
              </h3>
              <p className="text-xs text-sx-muted mt-0.5">
                Supports Markdown headings (`##`), bold text, bullet lists, and inline screenshots.
              </p>
            </div>

            <div className="inline-flex rounded-lg bg-sx-canvas border border-sx-border p-0.5">
              <button
                type="button"
                onClick={() => setEditorMode("write")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  editorMode === "write"
                    ? "bg-sx-stone text-sx-ink"
                    : "text-sx-muted hover:text-sx-ink"
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("preview")}
                className={`px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                  editorMode === "preview"
                    ? "bg-sx-stone text-sx-ink"
                    : "text-sx-muted hover:text-sx-ink"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {editorMode === "preview" ? (
            <div className="rounded-xl bg-sx-canvas border border-sx-border p-5 space-y-4">
              {coverImageUrl && (
                <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-sx-stone border border-sx-border">
                  <img
                    src={coverImageUrl}
                    alt={title || "Cover preview"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded border text-[11px] font-bold ${
                    getCategoryLabel(category).color
                  }`}
                >
                  {getCategoryLabel(category).label}
                </span>
                {isPinned && (
                  <span className="px-2 py-0.5 rounded bg-sx-green text-white text-[11px] font-bold">
                    Pinned Spotlight
                  </span>
                )}
                <span className="text-xs text-sx-muted">{authorName}</span>
              </div>
              <h2 className="text-xl font-extrabold text-sx-ink font-display">
                {title || "Untitled Blog Post"}
              </h2>
              <p className="text-xs sm:text-sm text-sx-ink-soft leading-relaxed border-l-2 border-sx-green pl-3">
                {summary || "Your short card summary will appear here..."}
              </p>
              <div className="pt-3 border-t border-sx-border whitespace-pre-wrap text-xs sm:text-sm text-sx-ink leading-relaxed font-sans">
                {content || "Start writing your guide or update to preview it here."}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-sx-ink">
                  Post Headline <span className="text-sx-red-text">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. What's Coming Next Week: Double-Booster Vieira Pack & Weekend Cash Cup"
                  className="w-full rounded-lg bg-sx-canvas border border-sx-border px-3.5 py-2.5 text-sm text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-sx-ink">
                    Blog Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NewsCategory)}
                    className="w-full rounded-lg bg-sx-canvas border border-sx-border px-3.5 py-2.5 text-xs font-medium text-sx-ink focus:outline-none focus:border-sx-green"
                  >
                    <option value="update">
                      Upcoming &amp; Patches (New Packs / Season Updates)
                    </option>
                    <option value="announcement">
                      What&apos;s Coming (New Platform Features &amp; Cups)
                    </option>
                    <option value="efootball_news">
                      Gameplay, Meta &amp; Squad Guides
                    </option>
                    <option value="escrow_guide">
                      Konami ID &amp; M-Pesa Escrow Guide
                    </option>
                    <option value="scammer_alert">
                      Scammer Alert &amp; Safety Advisory
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-sx-ink">
                    Author Byline
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="eFootballMarket Editorial Desk"
                    className="w-full rounded-lg bg-sx-canvas border border-sx-border px-3.5 py-2.5 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
                  />
                </div>
              </div>

              {/* Cover Image Upload + Presets */}
              <div className="space-y-2 rounded-xl bg-sx-canvas border border-sx-border p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-sx-ink">
                    Cover Banner Image
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sx-stone hover:bg-sx-elevated border border-sx-border text-xs font-semibold text-sx-ink cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-sx-green-text" />
                      <span>
                        {uploadingCover ? "Uploading..." : "Upload Cover Photo"}
                      </span>
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="Paste image URL or upload/pick a preset below..."
                  className="w-full rounded-md bg-sx-subtle border border-sx-border px-3 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-sx-muted mr-1">Presets:</span>
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setCoverImageUrl(preset.url)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                        coverImageUrl === preset.url
                          ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
                          : "bg-sx-stone border-sx-border text-sx-muted hover:text-sx-ink"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-sx-ink">
                  Card Teaser Summary (1–2 sentences){" "}
                  <span className="text-sx-red-text">*</span>
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Short summary shown on the Blog Hub, Homepage cards, and user alerts..."
                  rows={2}
                  className="w-full rounded-lg bg-sx-canvas border border-sx-border px-3.5 py-2 text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
                  required
                />
              </div>

              {/* Markdown Formatting Toolbar + Content */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-sx-ink">
                    Full Article / Guide Body <span className="text-sx-red-text">*</span>
                  </label>

                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertSnippet("\n## ", "\n")}
                      title="Section Heading"
                      className="p-1.5 rounded bg-sx-canvas border border-sx-border text-sx-ink hover:border-sx-green cursor-pointer"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet("\n### ", "\n")}
                      title="Subheading"
                      className="p-1.5 rounded bg-sx-canvas border border-sx-border text-sx-ink hover:border-sx-green cursor-pointer"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet("**", "**")}
                      title="Bold"
                      className="p-1.5 rounded bg-sx-canvas border border-sx-border text-sx-ink hover:border-sx-green cursor-pointer"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet("\n- ")}
                      title="Bullet List"
                      className="p-1.5 rounded bg-sx-canvas border border-sx-border text-sx-ink hover:border-sx-green cursor-pointer"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={inlineImgInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleInlineImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => inlineImgInputRef.current?.click()}
                      disabled={uploadingInline}
                      title="Upload & Insert Screenshot"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sx-canvas border border-sx-border text-[11px] font-semibold text-sx-ink hover:border-sx-green cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5 text-sx-green-text" />
                      <span>{uploadingInline ? "Adding..." : "Insert Photo"}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`## What's Coming Next\n\nExplain upcoming eFootball packs, tactical meta tips, or platform features...\n\n- Key takeaway 1\n- Key takeaway 2`}
                  rows={11}
                  className="w-full rounded-lg bg-sx-canvas border border-sx-border px-3.5 py-3 text-xs text-sx-ink placeholder:text-sx-muted font-mono focus:outline-none focus:border-sx-green leading-relaxed"
                  required
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 rounded-xl bg-sx-canvas border border-sx-border flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-sx-ink">
                      Pin as Featured Spotlight
                    </p>
                    <p className="text-[11px] text-sx-muted">
                      Highlights at top of Blog &amp; Homepage
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </label>

                {!editingId && (
                  <label className="p-3 rounded-xl bg-sx-canvas border border-sx-border flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-sx-ink">
                        Notify All Traders
                      </p>
                      <p className="text-[11px] text-sx-muted">
                        Send in-app notification bell alert
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={broadcastNotif}
                      onChange={(e) => setBroadcastNotif(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </label>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold"
                isLoading={saving}
              >
                <Send className="w-4 h-4" />
                <span>
                  {editingId
                    ? "Save Changes to Blog Post"
                    : broadcastNotif
                    ? "Publish Post & Notify Community"
                    : "Publish Blog Post"}
                </span>
              </Button>
            </form>
          )}
        </div>

        {/* RIGHT: PUBLISHED BLOG & GUIDES LIBRARY */}
        <div className="lg:col-span-5 rounded-2xl bg-sx-subtle border border-sx-border p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-sx-ink font-display">
              Live Blog &amp; Guides ({filteredLibrary.length})
            </h3>
            <select
              value={libraryFilter}
              onChange={(e) => setLibraryFilter(e.target.value)}
              className="rounded-md bg-sx-canvas border border-sx-border px-2.5 py-1 text-xs text-sx-ink focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="upcoming">What&apos;s Coming &amp; Updates</option>
              <option value="efootball_news">Meta &amp; Guides</option>
              <option value="escrow_guide">Konami ID &amp; Escrow</option>
              <option value="scammer_alert">Safety Alerts</option>
            </select>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredLibrary.map((item) => {
              const badge = getCategoryLabel(item.category);
              const builtIn = isStaticGuide(item.id);
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-sx-canvas border border-sx-border hover:border-sx-border-strong space-y-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      {item.is_pinned && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sx-green text-white">
                          Pinned
                        </span>
                      )}
                      {builtIn && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sx-stone text-sx-muted font-medium">
                          Evergreen
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!builtIn && (
                        <button
                          type="button"
                          onClick={() => handleTogglePin(item)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            item.is_pinned
                              ? "text-sx-green-text bg-sx-green-tint"
                              : "text-sx-muted hover:text-sx-ink hover:bg-sx-stone"
                          }`}
                          title={item.is_pinned ? "Unpin post" : "Pin to top"}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleLoadForEdit(item)}
                        className="p-1.5 rounded-md text-sx-muted hover:text-sx-ink hover:bg-sx-stone transition-colors cursor-pointer"
                        title={
                          builtIn
                            ? "Customize a copy of this guide"
                            : "Edit post"
                        }
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {!builtIn && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-md text-sx-muted hover:text-sx-red-text hover:bg-sx-red-tint transition-colors cursor-pointer"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-[13px] font-bold text-sx-ink line-clamp-2 leading-snug">
                    <Link
                      href={`/news/${item.slug}`}
                      target="_blank"
                      className="hover:text-sx-green-text transition-colors"
                    >
                      {item.title}
                    </Link>
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-sx-muted pt-1 border-t border-sx-border/60">
                    <span>
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sx-green-text font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Published</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
