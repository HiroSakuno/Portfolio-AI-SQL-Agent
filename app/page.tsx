"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: number;
  role: "agent" | "user";
  content: string;
  meta?: string;
  sql?: string;
};

type WebhookReply = {
  text: string;
  sql?: string;
};

const suggestedQuestions = [
  "How many orders were placed last month?",
  "List the customers who purchased the most in the last quarter.",
  "Show me the top five products by revenue.",
];

const initialMessages: Message[] = [];

const webhookUrl =
  process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL?.trim() ||
  "https://webhook.n8n.mindthedata.com.br/webhook/chat";
const powerBiUrl =
  process.env.NEXT_PUBLIC_POWER_BI_EMBED_URL?.trim() ||
  "https://app.powerbi.com/view?r=eyJrIjoiODY1YWVmMzMtZjk5NC00MmM4LThjMTAtYmNlZmNhZWE1N2VkIiwidCI6IjdmYjJkZGI5LWI3MmMtNGMxMy05ZDZkLWYyNDRiZWViNzZmZiJ9";

function extractReply(payload: unknown): WebhookReply | null {
  if (typeof payload === "string" && payload.trim()) {
    return { text: payload.trim() };
  }
  if (Array.isArray(payload)) return extractReply(payload[0]);
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const sql = typeof record.sql === "string" ? record.sql.trim() : undefined;
  for (const key of [
    "output",
    "response",
    "message",
    "text",
    "answer",
    "explanation",
  ]) {
    if (typeof record[key] === "string" && record[key].trim()) {
      return { text: record[key].trim(), sql };
    }
  }

  if (record.data) return extractReply(record.data);
  return null;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [expandedSqlIds, setExpandedSqlIds] = useState<Set<number>>(new Set());
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  function toggleSql(messageId: number) {
    setExpandedSqlIds((current) => {
      const next = new Set(current);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }

  async function sendQuestion(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: trimmedQuestion },
    ]);
    setDraft("");
    setIsSending(true);

    if (!webhookUrl) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "agent",
          content:
            "The chat surface is ready, but its webhook is not configured yet. Add NEXT_PUBLIC_CHAT_WEBHOOK_URL to connect your agent.",
          meta: "SETUP REQUIRED",
        },
      ]);
      setIsSending(false);
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmedQuestion }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) throw new Error("The webhook returned an error.");

      const reply = extractReply(payload);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "agent",
          content:
            reply?.text ??
            "The query completed, but the webhook did not return a readable message.",
          meta: "LIVE RESPONSE",
          sql: reply?.sql,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "agent",
          content:
            "I couldn’t reach the webhook. Check its URL, CORS policy, and availability, then try again.",
          meta: "CONNECTION ERROR",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(draft);
    }
  }

  return (
    <main className="site-shell">
      <section className="intro" id="top">
        <div className="intro-copy">
          <p className="kicker">
            <span className="kicker-line" /> BI · data · AI
          </p>
          <h1>Hiro Sakuno</h1>
          <p className="hero-role">BI Engineer / Data Engineer / AI Agents</p>
          <p className="intro-text">
            I’m a BI Engineer with 5+ years of experience, a degree in Civil
            Engineering, and Microsoft certifications in Power BI (PL-300) and
            Fabric Data Engineering (DP-700). I work with global teams to turn
            business questions into trusted data products.
          </p>
        </div>

      </section>

      <section className="workspace-section" id="workspace">
        <div className="workspace-heading">
          <div>
            <p className="section-label">01 / live workspace</p>
            <h2>
              Ask the agent.
              <br />
              Validate the answer in Power BI.
            </h2>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="panel chat-panel" aria-labelledby="chat-title">
            <header className="panel-header">
              <div>
                <p className="panel-eyebrow">AI SQL agent</p>
                <h3 id="chat-title">Ask the agent</h3>
              </div>
              <span className="panel-badge">
                <span className="status-dot" aria-hidden="true" /> Online
              </span>
            </header>

            <div className="message-list" aria-live="polite" ref={messageListRef}>
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="message-meta">
                    {message.role === "agent" ? "agent" : "you"}
                    {message.meta ? ` · ${message.meta}` : ""}
                  </div>
                  <p>{message.content}</p>
                  {message.sql ? (
                    <>
                      <button
                        aria-expanded={expandedSqlIds.has(message.id)}
                        className="sql-toggle"
                        onClick={() => toggleSql(message.id)}
                        type="button"
                      >
                        {expandedSqlIds.has(message.id) ? "Hide SQL" : "Show SQL"}
                        <span aria-hidden="true">⌄</span>
                      </button>
                      {expandedSqlIds.has(message.id) ? (
                        <pre className="sql-code"><code>{message.sql}</code></pre>
                      ) : null}
                    </>
                  ) : null}
                </article>
              ))}
              {isSending ? (
                <article className="message agent typing-message">
                  <div className="message-meta">agent · querying</div>
                  <p className="typing-dots" aria-label="Agent is typing">
                    <span />
                    <span />
                    <span />
                  </p>
                </article>
              ) : null}
            </div>

            <div className="suggested-questions">
              <p>Try a question</p>
              <div className="suggestion-list">
                {suggestedQuestions.map((question) => (
                  <button
                    className="suggestion"
                    key={question}
                    onClick={() => void sendQuestion(question)}
                    type="button"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            <form className="chat-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="question">
                Ask a question about the database
              </label>
              <textarea
                id="question"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your data..."
                rows={1}
                value={draft}
              />
              <button aria-label="Send question" disabled={isSending || !draft.trim()} type="submit">
                <span aria-hidden="true">↗</span>
              </button>
              <p>Enter to send · Shift + Enter for a new line</p>
            </form>
          </section>

          <section className="panel report-panel" aria-labelledby="report-title">
            <header className="panel-header">
              <div>
                <p className="panel-eyebrow">Power BI report</p>
                <h3 id="report-title">Power BI report</h3>
              </div>
              <span className="report-mark" aria-hidden="true">
                PBI
              </span>
            </header>

            <div className="report-frame">
              {powerBiUrl ? (
                <iframe
                  allowFullScreen
                  className="power-bi-embed"
                  loading="lazy"
                  src={powerBiUrl}
                  title="Power BI embedded report"
                />
              ) : (
                <div className="report-placeholder">
                  <div className="report-placeholder-topline">
                    <span>Executive overview</span>
                    <span>Last 30 days · UTC</span>
                  </div>
                  <div className="placeholder-hero">
                    <p>Connect your live report</p>
                    <strong>Power BI goes here.</strong>
                    <span>
                      Set <code>NEXT_PUBLIC_POWER_BI_EMBED_URL</code> to load
                      your published embed URL.
                    </span>
                  </div>
                  <div className="placeholder-metrics">
                    <div>
                      <span>Revenue</span>
                      <strong>—</strong>
                    </div>
                    <div>
                      <span>Growth</span>
                      <strong>—</strong>
                    </div>
                    <div>
                      <span>Coverage</span>
                      <strong>—</strong>
                    </div>
                  </div>
                  <div className="placeholder-chart" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="how-heading">
          <p className="section-label">02 / how it works</p>
          <h2>From natural language to structured answers.</h2>
        </div>
        <div className="steps">
          <article className="step">
            <span>01</span>
            <h3>NL-to-SQL chatbot</h3>
            <p>
              Ask a question in natural language and the agent translates it
              into a SQL query grounded in the database schema.
            </p>
          </article>
          <article className="step">
            <span>02</span>
            <h3>Supabase PostgreSQL</h3>
            <p>
              The generated query runs directly against Supabase PostgreSQL,
              returning data from the connected database.
            </p>
          </article>
          <article className="step">
            <span>03</span>
            <h3>Structured webhook response</h3>
            <p>
              The website sends the question through a webhook and receives a
              structured response with the explanation and generated SQL.
            </p>
          </article>
        </div>
      </section>

      <footer className="footer">
        <span>sql agent / supabase × ai × power bi</span>
        <span>built for better questions</span>
      </footer>
    </main>
  );
}
