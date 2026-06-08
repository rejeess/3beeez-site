"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type MessageType = "user" | "bot" | "lead-form";

type Message = {
  id: string;
  text: string;
  type: MessageType;
};

type LeadData = {
  name: string;
  email: string;
  phone: string;
};

type ChatDemoProps = {
  companySlug?: string;
  companyName?: string;
  botId?: string;
  promptChips: string[];
  variant?: "full" | "widget";
  pageUrl?: string;
};

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createWelcomeMessage(companyName: string) {
  return `Welcome to ${companyName}. I can help answer questions using ${companyName}'s approved website content, documents, and support information.`;
}

// Inline lead capture form rendered inside a chat bubble
function LeadCaptureCard({
  companyName,
  onSubmit,
  onSkip,
  submitting,
}: {
  companyName: string;
  onSubmit: (lead: LeadData) => void;
  onSkip: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bot trap — should always be empty
  const [error, setError] = useState("");
  const renderedAt = useRef(Date.now());

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Bot detection: honeypot filled or submitted impossibly fast
    if (honeypot || Date.now() - renderedAt.current < 1500) {
      onSubmit({ name: "bot", email: "bot@bot.invalid", phone: "" }); // silently dismiss
      return;
    }
    if (!name.trim()) { setError("Your name is required."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("A valid email address is required."); return;
    }
    setError("");
    onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() });
  }

  return (
    <div className="bubble bubble-bot bubble-lead-form">
      <p style={{ margin: "0 0 4px", fontSize: "0.9rem" }}>
        To help the {companyName} team follow up, could you share a few details?
      </p>
      <form className="lead-capture-form" onSubmit={handleSubmit} noValidate>
        {/* Honeypot — hidden from real users */}
        <input
          name="website"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          style={{ display: "none", position: "absolute", left: "-9999px" }}
        />
        <input
          type="text"
          placeholder="Your name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <input
          type="email"
          placeholder="Email address *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
        {error && <p className="lead-capture-error">{error}</p>}
        <div className="lead-capture-actions">
          <button className="button button-primary" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Share details"}
          </button>
          <button className="lead-capture-skip" type="button" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
}

export function ChatDemo({
  botId = "3beeez-main",
  companySlug = "3beeez",
  companyName = "3Beeez",
  promptChips,
  variant = "full",
  pageUrl,
}: ChatDemoProps) {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string>("");
  const [visitorId, setVisitorId] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", type: "bot", text: createWelcomeMessage(companyName) },
  ]);

  // Lead capture state
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [pendingLead, setPendingLead] = useState<LeadData | null>(null);
  const leadCapturedRef = useRef(false);
  const leadFormInsertedRef = useRef(false);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore session state from localStorage
  useEffect(() => {
    const storedConvId = window.localStorage.getItem("threebeeez_conversation_id");
    const storedVisitorId = window.localStorage.getItem("threebeeez_visitor_id");
    const captured = window.localStorage.getItem("threebeeez_lead_captured") === "1";

    if (storedConvId) setConversationId(storedConvId);
    if (storedVisitorId) {
      setVisitorId(storedVisitorId);
    } else {
      const nextVisitorId = createId("visitor");
      window.localStorage.setItem("threebeeez_visitor_id", nextVisitorId);
      setVisitorId(nextVisitorId);
    }
    if (captured) {
      leadCapturedRef.current = true;
      setLeadCaptured(true);
    }
  }, []);

  // Scroll to the latest message
  useEffect(() => {
    if (messages.length <= 1) return;
    const last = messages[messages.length - 1];
    if (last.type === "bot") {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (variant === "widget") inputRef.current?.focus();
  }, [variant]);

  async function handleLeadSubmit(lead: LeadData) {
    setLeadSubmitting(true);
    const currentConvId = conversationId;

    if (currentConvId) {
      // Conversation already exists — save immediately
      try {
        await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: currentConvId,
            companySlug,
            botId,
            visitorId: visitorId || undefined,
            sourceUrl: pageUrl || window.location.href,
            lead,
          }),
        });
      } catch {
        // Non-fatal — lead will still be sent with the next message
      }
    } else {
      // No conversation yet — store and send with first message
      setPendingLead(lead);
    }

    window.localStorage.setItem("threebeeez_lead_captured", "1");
    leadCapturedRef.current = true;
    setLeadCaptured(true);
    setLeadSubmitting(false);
  }

  function handleLeadSkip() {
    window.localStorage.setItem("threebeeez_lead_captured", "1");
    leadCapturedRef.current = true;
    setLeadCaptured(true);
  }

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned || status === "sending") return;

    setMessages((current) => [
      ...current,
      { id: createId("user"), type: "user", text: cleaned },
    ]);
    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          companySlug,
          botId,
          visitorId: visitorId || undefined,
          sourceUrl: pageUrl || window.location.href,
          message: cleaned,
          lead: pendingLead || undefined,
        }),
      });

      if (!response.ok) throw new Error("Unable to store chat.");

      const payload = (await response.json()) as {
        conversationId: string;
        companySlug: string;
        visitorId: string;
        reply: string;
      };

      if (pendingLead) setPendingLead(null);

      setConversationId(payload.conversationId);
      setVisitorId(payload.visitorId);
      window.localStorage.setItem("threebeeez_conversation_id", payload.conversationId);
      window.localStorage.setItem("threebeeez_visitor_id", payload.visitorId);

      const botMsg: Message = { id: createId("bot"), type: "bot", text: payload.reply };

      // Insert the lead capture form after the FIRST real bot reply
      if (!leadCapturedRef.current && !leadFormInsertedRef.current) {
        leadFormInsertedRef.current = true;
        setMessages((current) => [
          ...current,
          botMsg,
          { id: createId("lf"), type: "lead-form", text: "" },
        ]);
      } else {
        setMessages((current) => [...current, botMsg]);
      }

      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("We could not save this chat right now. Please try again.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input;
    setInput("");
    void sendMessage(value);
  }

  return (
    <div className={variant === "widget" ? "widget-chat-shell" : "demo-layout"}>
      {variant === "full" ? (
        <div className="demo-sidebar">
          {promptChips.map((prompt) => (
            <button
              key={prompt}
              className="prompt-chip"
              type="button"
              onClick={() => void sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`chat-card ${variant === "widget" ? "chat-card-widget" : ""}`}>
        <div className="chat-header">
          <div>
            <strong>3Beeez Assistant</strong>
            <span>
              {variant === "widget"
                ? `${companyName} live support`
                : "Configured for a client support website"}
            </span>
          </div>
          <span className="chat-live">Live demo</span>
        </div>

        <div className="chat-thread">
          {messages.map((message, index) => {
            if (message.type === "lead-form") {
              if (leadCaptured) return null;
              return (
                <LeadCaptureCard
                  key={message.id}
                  companyName={companyName}
                  onSubmit={handleLeadSubmit}
                  onSkip={handleLeadSkip}
                  submitting={leadSubmitting}
                />
              );
            }
            return (
              <div
                key={message.id}
                ref={index === messages.length - 1 ? lastMessageRef : undefined}
                className={`bubble bubble-${message.type}`}
              >
                {message.text}
              </div>
            );
          })}
          <div ref={threadEndRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="chat-input">
            Ask a question
          </label>
          <input
            ref={inputRef}
            id="chat-input"
            name="chat-input"
            type="text"
            placeholder="Ask about onboarding, documents, or website embedding"
            autoComplete="off"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button type="submit">Send</button>
        </form>
        <div className="chat-status-row">
          <span>
            {variant === "widget"
              ? "Messages are stored for the company admin portal."
              : "Admin view: stored chats appear in /admin and each client can use its own portal."}
          </span>
          {status === "sending" ? <span>Saving conversation...</span> : null}
          {errorMessage ? <span className="chat-error">{errorMessage}</span> : null}
        </div>
      </div>
    </div>
  );
}
