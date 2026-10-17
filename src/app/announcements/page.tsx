"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Pin,
  Calendar,
  Search,
  Loader2,
  Tag,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import { useRole } from "@/context/RoleContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";
import { Avatar } from "@/components/ui/Avatar";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  pinned: boolean;
  createdAt: string;
  timeAgo: string;
}

const CATEGORIES = [
  "Company News",
  "Product & Engineering",
  "Policy Updates",
  "Social & Events",
  "Operations",
  "Leadership Notes",
];

export default function AnnouncementsPage() {
  const { getToken, isSignedIn } = useAuth();
  const { isHRAdmin } = useRole();

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Company News");
  const [newPinned, setNewPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected item detail modal
  const [activeItem, setActiveItem] = useState<AnnouncementItem | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/announcements`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setAnnouncements(list);
      }
    } catch {
      toast.error("Failed to load announcements", "Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Required fields", "Please provide both title and content.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/v1/announcements`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
          priority: newPinned ? "pinned" : "normal",
          pinned: newPinned,
        }),
      });

      if (res.ok) {
        toast.success("News published", "Announcement is now live on the company dashboard.");
        setCreateModalOpen(false);
        setNewTitle("");
        setNewContent("");
        setNewPinned(false);
        await fetchAnnouncements();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error("Publish failed", err.detail || err.title || "Unable to save announcement.");
      }
    } catch (err: any) {
      toast.error("Network error", err.message || "Failed to reach server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/v1/announcements/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        toast.success("Deleted", "Announcement removed.");
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        if (activeItem?.id === id) setActiveItem(null);
      }
    } catch {
      toast.error("Delete failed", "Could not remove post.");
    }
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchSearch =
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.authorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === "All" || a.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [announcements, searchTerm, selectedCategory]);

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "100%", padding: 0 }}>
      <PageHeader
        title="Company News & Announcements"
        subtitle="Publish company-wide updates, leadership notes, events, and department news."
        icon={<Megaphone size={28} className="text-white" />}
        actions={
          isHRAdmin && (
            <button
              className="btn-primary"
              onClick={() => setCreateModalOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Plus size={16} /> New Announcement
            </button>
          )
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px", background: "var(--bg-page)" }}>
        {/* Filters Bar */}
        <div className="row-between mb-24" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="row gap-12" style={{ flex: 1, maxWidth: 500 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={16}
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)" }}
              />
              <Input
                placeholder="Search news, topics, authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="row gap-8">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: 200 }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardBody style={{ textAlign: "center", padding: "64px 20px" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "var(--primary-tint, #f5f3ff)",
                  color: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Megaphone size={26} />
              </div>
              <h3 className="text-base fw-700 text-1">No announcements found</h3>
              <p className="text-xs text-5 mt-4" style={{ maxWidth: 360, margin: "4px auto 20px" }}>
                {searchTerm || selectedCategory !== "All"
                  ? "Try clearing your filters or searching for something else."
                  : "Keep your organization engaged and aligned by publishing company updates."}
              </p>
              {isHRAdmin && (
                <button className="btn-primary" onClick={() => setCreateModalOpen(true)}>
                  <Plus size={16} className="mr-8" /> Post First Announcement
                </button>
              )}
            </CardBody>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
            {filteredAnnouncements.map((post) => (
              <Card
                key={post.id}
                style={{
                  border: post.pinned ? "1.5px solid var(--primary)" : "1px solid var(--card-border)",
                  borderRadius: 16,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                }}
                onClick={() => setActiveItem(post)}
              >
                <CardBody style={{ padding: "20px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Card Header */}
                  <div className="row-between mb-12">
                    <div className="row gap-8 align-center">
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: "var(--primary-tint, #f5f3ff)",
                          color: "var(--primary)",
                        }}
                      >
                        {post.category || "Company News"}
                      </span>
                      {post.pinned && (
                        <span
                          className="row gap-4 align-center text-xs fw-700"
                          style={{ color: "var(--primary)", background: "rgba(162, 56, 255, 0.08)", padding: "3px 8px", borderRadius: 20 }}
                        >
                          <Pin size={11} fill="currentColor" /> Pinned
                        </span>
                      )}
                    </div>

                    {isHRAdmin && (
                      <button
                        type="button"
                        className="btn-circle"
                        style={{ width: 28, height: 28, color: "#ef4444" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnouncement(post.id, post.title);
                        }}
                        title="Delete announcement"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Title & Excerpt */}
                  <h3 className="text-base fw-700 text-1 mb-8" style={{ lineHeight: 1.3 }}>
                    {post.title}
                  </h3>
                  <p
                    className="text-xs text-4 mb-20"
                    style={{
                      lineHeight: 1.6,
                      flex: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {post.content}
                  </p>

                  {/* Author Footer */}
                  <div className="row-between pt-14 align-center" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="row gap-8 align-center">
                      <Avatar src={post.authorAvatar} name={post.authorName} size="xs" />
                      <div>
                        <div className="text-xs fw-600 text-1">{post.authorName || "HR & People Ops"}</div>
                        <div className="text-xs text-5" style={{ fontSize: 10 }}>{post.authorRole || "Company Administrator"}</div>
                      </div>
                    </div>
                    <div className="text-xs text-5 row gap-4 align-center" style={{ fontSize: 11 }}>
                      <Calendar size={12} /> {post.timeAgo || post.createdAt?.split("T")[0] || "Recent"}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Publish News & Announcement"
        subtitle="Broadcast an official update to all employees and display on dashboard feeds"
        width={560}
        footer={
          <>
            <button className="btn-neutral" onClick={() => setCreateModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleCreateAnnouncement} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin mr-6" /> Publishing...
                </>
              ) : (
                <>
                  <Megaphone size={15} className="mr-6" /> Publish Post
                </>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAnnouncement} className="col gap-16">
          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Announcement Headline *
            </label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Q4 Town Hall Meeting & Annual Rewards Announcement"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
                Topic / Category
              </label>
              <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                />
                <span className="fw-600 text-2">Pin to top of news feed</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs fw-700 text-2 mb-6" style={{ display: "block" }}>
              Content / Details *
            </label>
            <Textarea
              rows={6}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write the full update, details, agenda, and action items for your team..."
              required
            />
          </div>
        </form>
      </Modal>

      {/* View Post Detail Modal */}
      {activeItem && (
        <Modal
          isOpen={true}
          onClose={() => setActiveItem(null)}
          title={activeItem.title}
          subtitle={`${activeItem.category} · Posted by ${activeItem.authorName} (${activeItem.timeAgo || activeItem.createdAt?.split("T")[0]})`}
          width={640}
          footer={
            <div className="row-between w-full align-center">
              {isHRAdmin ? (
                <button
                  type="button"
                  className="btn-neutral btn-sm"
                  style={{ color: "#ef4444" }}
                  onClick={() => handleDeleteAnnouncement(activeItem.id, activeItem.title)}
                >
                  <Trash2 size={13} className="mr-6" /> Delete Announcement
                </button>
              ) : <div />}
              <button className="btn-primary" onClick={() => setActiveItem(null)}>
                Done
              </button>
            </div>
          }
        >
          <div className="col gap-16 text-sm" style={{ lineHeight: 1.7, color: "var(--text-2)", whiteSpace: "pre-wrap" }}>
            {activeItem.content}
          </div>
        </Modal>
      )}
    </div>
  );
}
