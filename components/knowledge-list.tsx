"use client";

import { useState } from "react";
import type { KnowledgeEntryRecord } from "@/lib/db";
import { SubmitButton } from "@/components/submit-button";

type Props = {
  entries: KnowledgeEntryRecord[];
  deleteAction: (formData: FormData) => Promise<void>;
};

function KnowledgeEntry({
  entry,
  deleteAction,
}: {
  entry: KnowledgeEntryRecord;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = entry.content.length > 300;
  const preview = isLong && !expanded ? entry.content.slice(0, 300) + "…" : entry.content;

  return (
    <div className="knowledge-item">
      <div className="knowledge-item-header">
        <div className="knowledge-item-body">
          <span className="knowledge-kind">{entry.kind}</span>
          <strong className="knowledge-item-title">{entry.title}</strong>
          <p className="knowledge-item-preview">{preview}</p>
          {isLong && (
            <button
              className="knowledge-toggle-btn"
              type="button"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
          <span className="knowledge-item-date">
            Added {new Date(entry.createdAt).toLocaleDateString()}
          </span>
        </div>
        <form action={deleteAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <SubmitButton label="Delete" pendingLabel="Deleting…" className="knowledge-delete-btn" />
        </form>
      </div>
    </div>
  );
}

export function KnowledgeList({ entries, deleteAction }: Props) {
  if (entries.length === 0) {
    return <p style={{ color: "var(--muted)", margin: "16px 0 0" }}>No knowledge sources added yet.</p>;
  }
  return (
    <div className="knowledge-list">
      {entries.map((entry) => (
        <KnowledgeEntry key={entry.id} entry={entry} deleteAction={deleteAction} />
      ))}
    </div>
  );
}
