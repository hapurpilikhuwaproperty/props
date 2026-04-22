"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Shortlist } from "../types";

const voteLabels = ["1", "2", "3", "4", "5"];

export default function ShortlistBoard({ token }: { token: string }) {
  const router = useRouter();
  const { isAuthed, isReady, user } = useAuth();
  const [shortlist, setShortlist] = useState<Shortlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        const { data } = await api.get(`/shortlists/shared/${token}`, { signal: controller.signal });
        if (!isActive) return;
        setShortlist(data);
        setNoteDrafts(
          Object.fromEntries(
            data.items.map((item: Shortlist["items"][number]) => [item.property.id, item.note || ""]),
          ),
        );
      } catch (err: any) {
        if (err?.code !== "ERR_CANCELED" && isActive) {
          setError(err.response?.data?.message || "Unable to load shortlist");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [token]);

  const shareUrl = useMemo(
    () => (typeof window === "undefined" ? "" : `${window.location.origin}/shortlists/${token}`),
    [token],
  );

  const requireSession = () => {
    if (!isAuthed) {
      router.push(`/auth/login?next=${encodeURIComponent(`/shortlists/${token}`)}`);
      return false;
    }
    return true;
  };

  const joinShortlist = async () => {
    if (!isReady || !requireSession()) return;
    try {
      const { data } = await api.post(`/shortlists/shared/${token}/join`);
      setShortlist(data);
      setMessage("You joined this shortlist. You can now vote and comment; structural edits stay with the owner.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to join shortlist");
    }
  };

  const updateNote = async (propertyId: number) => {
    if (!shortlist || !requireSession()) return;
    try {
      const { data } = await api.patch(`/shortlists/${shortlist.id}/items/${propertyId}`, {
        note: noteDrafts[propertyId] || "",
      });
      setShortlist(data);
      setMessage("Decision note saved.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to save note");
    }
  };

  const submitComment = async (propertyId: number) => {
    if (!shortlist || !requireSession()) return;
    const body = commentDrafts[propertyId]?.trim();
    if (!body) return;
    try {
      const { data } = await api.post(`/shortlists/${shortlist.id}/items/${propertyId}/comments`, { body });
      setShortlist(data);
      setCommentDrafts((current) => ({ ...current, [propertyId]: "" }));
      setMessage("Comment added.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to add comment");
    }
  };

  const vote = async (propertyId: number, value: number) => {
    if (!shortlist || !requireSession()) return;
    try {
      const { data } = await api.put(`/shortlists/${shortlist.id}/items/${propertyId}/vote`, { value });
      setShortlist(data);
      setMessage("Vote recorded.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to record vote");
    }
  };

  const removeItem = async (propertyId: number) => {
    if (!shortlist || !requireSession()) return;
    try {
      const { data } = await api.delete(`/shortlists/${shortlist.id}/items/${propertyId}`);
      setShortlist(data);
      setMessage("Property removed from shortlist.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to remove property");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Share link copied.");
    } catch {
      setError("Unable to copy share link");
    }
  };

  if (loading) return <div className="container py-12 text-sm text-slate-500">Loading shortlist...</div>;
  if (error && !shortlist) return <div className="container py-12 text-sm text-slate-600">{error}</div>;
  if (!shortlist) return null;

  const isParticipant = shortlist.isOwner || shortlist.collaborators.some((collaborator) => collaborator.id === user?.id);

  return (
    <div className="container py-12 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Shared shortlist</p>
          <h1 className="text-3xl font-semibold">{shortlist.name}</h1>
          <p className="text-sm text-slate-600">
            Owned by {shortlist.owner.name}. {shortlist.itemCount} options tracked.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isParticipant && (
            <button onClick={joinShortlist} className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium">
              Join shortlist
            </button>
          )}
          <button onClick={copyLink} className="px-4 py-2 rounded-full border text-sm font-medium">
            Copy share link
          </button>
          <Link href="/dashboard/shortlists" className="px-4 py-2 rounded-full border text-sm font-medium">
            My shortlists
          </Link>
        </div>
      </div>

      {(message || error) && (
        <p className={`text-sm ${error ? "text-red-600" : "text-brand"}`}>{error || message}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="bg-white border rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Decision team</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="font-medium">{shortlist.owner.name}</p>
              {shortlist.owner.email && <p className="text-sm text-slate-500">{shortlist.owner.email}</p>}
              <p className="text-xs uppercase tracking-wide text-slate-500 mt-2">Owner</p>
            </div>
            {shortlist.collaborators.map((collaborator) => (
              <div key={collaborator.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-medium">{collaborator.name}</p>
                {collaborator.email && <p className="text-sm text-slate-500">{collaborator.email}</p>}
                <p className="text-xs uppercase tracking-wide text-slate-500 mt-2">
                  {collaborator.canEdit ? "Editor" : "Viewer"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border rounded-3xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">How to use this board</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <p>Vote each property from 1 to 5 to signal conviction.</p>
            <p>Add short decision notes after calls or site visits so the team sees what changed.</p>
            <p>Use comments for blockers: paperwork, commute, budget stretch, or negotiation points.</p>
          </div>
        </section>
      </div>

      <div className="space-y-5">
        {shortlist.items.map((item) => (
          <article key={item.id} className="bg-white border rounded-3xl p-6 space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-brand-soft text-brand">Priority {item.priority}/5</span>
                  {item.voteAverage != null && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                      Team score {item.voteAverage}/5
                    </span>
                  )}
                  {(item.property.shortlistCount ?? 0) > 0 && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {item.property.shortlistCount} shortlist saves
                    </span>
                  )}
                </div>
                <Link href={`/properties/${item.property.id}`} className="text-2xl font-semibold text-slate-900">
                  {item.property.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {item.property.location} • ₹{Number(item.property.price).toLocaleString("en-IN")} • score{" "}
                  {item.property.qualityScore ?? 0}/100
                </p>
                {item.property.recommendationReason && <p className="text-sm text-brand">{item.property.recommendationReason}</p>}
              </div>
              {shortlist.canEdit && (
                <button onClick={() => void removeItem(item.property.id)} className="text-sm text-slate-500 underline">
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="space-y-3">
                <h3 className="font-semibold">Decision note</h3>
                <textarea
                  className="w-full min-h-28 rounded-2xl border px-4 py-3 text-sm"
                  value={noteDrafts[item.property.id] || ""}
                  onChange={(event) => setNoteDrafts((current) => ({ ...current, [item.property.id]: event.target.value }))}
                  placeholder="Add why this is interesting, risky, or worth a revisit."
                  disabled={!shortlist.canEdit}
                />
                {shortlist.canEdit && (
                  <button onClick={() => void updateNote(item.property.id)} className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium">
                    Save note
                  </button>
                )}
              </section>

              <section className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Team vote</h3>
                  <div className="flex flex-wrap gap-2">
                    {voteLabels.map((label, index) => {
                      const value = index + 1;
                      const active = item.myVote === value;
                      return (
                        <button
                          key={label}
                          onClick={() => void vote(item.property.id, value)}
                          className={`h-10 w-10 rounded-full border text-sm font-medium ${active ? "bg-brand text-white border-brand" : "text-slate-600"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Comments</h3>
                  <div className="space-y-3">
                    {item.comments.map((comment) => (
                      <div key={comment.id} className="rounded-2xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-sm">{comment.author.name}</p>
                          <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{comment.body}</p>
                      </div>
                    ))}
                    {item.comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-full border px-4 py-2 text-sm"
                      value={commentDrafts[item.property.id] || ""}
                      onChange={(event) => setCommentDrafts((current) => ({ ...current, [item.property.id]: event.target.value }))}
                      placeholder="Add a decision comment"
                    />
                    <button onClick={() => void submitComment(item.property.id)} className="px-4 py-2 rounded-full border text-sm font-medium">
                      Post
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
