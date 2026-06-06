"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  text: string;
  type: "user" | "bot";
};

type ChatDemoProps = {
  companySlug?: string;
  companyName?: string;
  botId?: string;
  promptChips: string[];
  variant?: "full" | "widget";
  pageUrl?: string;
};

type LeadForm = {
  name: string;
  email: string;
  company: string;
};

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createWelcomeMessage(companyName: string) {
  return `Welcome to ${companyName}. I can help answer questions using ${companyName}'s approved website content, documents, and support information.`;
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
  const [leadForm, setLeadForm] = useState<LeadForm>({
    name: "",
    email: "",
    company: "",
  });
  const [conversationId, setConversationId] = useState<string>("");
  const [visitorId, setVisitorId] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "bot",
      text: createWelcomeMessage(companyName),
    },
  ]);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length <= 1) return;
    const last = messages[messages.length - 1];
    if (last.type === "bot") {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (variant === "widget") {
      inputRef.current?.focus();
    }
  }, [variant]);

  useEffect(() => {
    const storedConversationId = window.localStorage.getItem(
      "threebeeez_conversation_id"
    );
    const storedVisitorId = window.localStorage.getItem("threebeeez_visitor_id");

    if (storedConversationId) {
      setConversationId(storedConversationId);
    }

    if (storedVisitorId) {
      setVisitorId(storedVisitorId);
      return;
    }

    const nextVisitorId = createId("visitor");
    window.localStorage.setItem("threebeeez_visitor_id", nextVisitorId);
    setVisitorId(nextVisitorId);
  }, []);

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned || status === "sending") return;

    setMessages((current) => [
      ...current,
      {
        id: createId("user"),
        type: "user",
        text: cleaned,
      },
    ]);
    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          companySlug,
          botId,
          visitorId: visitorId || undefined,
          sourceUrl: pageUrl || window.location.href,
          message: cleaned,
          lead: leadForm,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to store chat.");
      }

      const payload = (await response.json()) as {
        conversationId: string;
        companySlug: string;
        visitorId: string;
        reply: string;
      };

      setConversationId(payload.conversationId);
      setVisitorId(payload.visitorId);
      window.localStorage.setItem(
        "threebeeez_conversation_id",
        payload.conversationId
      );
      window.localStorage.setItem("threebeeez_visitor_id", payload.visitorId);

      setMessages((current) => [
        ...current,
        {
          id: createId("bot"),
          type: "bot",
          text: payload.reply,
        },
      ]);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage(
        "We could not save this chat right now. Please try again."
      );
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
          <div className="lead-card">
            <strong>Lead capture for admin</strong>
            <p>
              Optional details below will be stored with the conversation so your
              admin team at {companyName} can follow up later.
            </p>
            <div className="lead-field-list">
              <input
                type="text"
                placeholder="Visitor name"
                value={leadForm.name}
                onChange={(event) =>
                  setLeadForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <input
                type="email"
                placeholder="Visitor email"
                value={leadForm.email}
                onChange={(event) =>
                  setLeadForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
              <input
                type="text"
                placeholder="Company name"
                value={leadForm.company}
                onChange={(event) =>
                  setLeadForm((current) => ({
                    ...current,
                    company: event.target.value,
                  }))
                }
              />
            </div>
          </div>

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
          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
              className={`bubble bubble-${message.type}`}
            >
              {message.text}
            </div>
          ))}
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
