import { headers } from "next/headers";
import { ChatDemo } from "@/components/chat-demo";
import { FloatingChatButton } from "@/components/floating-chat-button";
import { LogoutForm } from "@/components/logout-form";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db";
import { purchasePlans } from "@/lib/purchase";

const promptChips = [
  "What documents can the bot learn from?",
  "How do we add this chatbot to our website?",
  "Can the bot answer in real time for support questions?",
];

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const threeBeeezCompany = getCompanyBySlug("3beeez");
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = host.startsWith("localhost") || host.match(/^\d+\.\d+\.\d+\.\d+/) ? "http" : "https";
  const origin = `${proto}://${host}`;

  return (
    <>
    <div className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="3Beeez home">
          <span className="brand-mark">3B</span>
          <span className="brand-text">3beeez.com</span>
        </a>
        <nav className="site-nav" aria-label="Primary">
          <a href="#services">Services</a>
          <a href="#platform">Platform</a>
          <a href="#demo">Demo</a>
          <a href="#pricing">Pricing</a>
          <a href="#launch">Launch</a>
          {currentUser?.role === "owner" ? <a href="/admin">Admin</a> : null}
          {currentUser?.role === "client_admin" ? <a href="/portal">Portal</a> : null}
          {!currentUser ? <a href="/login">Login</a> : null}
        </nav>
        {currentUser ? (
          <LogoutForm />
        ) : (
          <a className="nav-cta" href="#launch">
            Book a discovery call
          </a>
        )}
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">AI chat service for customer-facing websites</p>
            <h1>Turn your company knowledge into a live website chatbot.</h1>
            <p className="hero-text">
              3Beeez helps businesses launch real-time AI chat experiences using
              their own documents, FAQs, and website content. We handle the AI,
              the widget, and the embedded script so your customers get instant,
              useful answers.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#launch">
                Start your build
              </a>
              <a className="button button-secondary" href="#platform">
                See how it works
              </a>
              <a className="button button-secondary" href="/test-site/acme-support">
                Open test site
              </a>
            </div>
            <div className="hero-proof">
              <div>
                <strong>Real-time replies</strong>
                <span>Fast customer support on your website</span>
              </div>
              <div>
                <strong>Train on your data</strong>
                <span>Documents, webpages, PDFs, and internal knowledge</span>
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <div className="signal-card">
              <span className="signal-label">Deployment concept</span>
              <strong>Website AI assistant</strong>
              <p>
                One script tag. One branded widget. Answers based on your
                business data.
              </p>
            </div>
            <div className="hero-console">
              <div className="console-header">
                <span className="status-dot" />
                <span>3Beeez launch flow</span>
              </div>
              <div className="console-line">
                <span>1</span> Upload company files and website sources
              </div>
              <div className="console-line">
                <span>2</span> Build a branded chatbot with guardrails
              </div>
              <div className="console-line">
                <span>3</span> Add one script tag to the client site
              </div>
              <div className="console-line">
                <span>4</span> Start replying to visitors in real time
              </div>
            </div>
            <div className="metric-grid">
              <article>
                <strong>24/7</strong>
                <span>Always-on support layer</span>
              </article>
              <article>
                <strong>1 tag</strong>
                <span>Simple installation on any website</span>
              </article>
              <article>
                <strong>Multi-source</strong>
                <span>Webpages, docs, PDFs, policies, manuals</span>
              </article>
            </div>
          </div>
        </section>

        <section className="logo-band" aria-label="Positioning statement">
          <p>
            Designed for IT service companies, SaaS teams, e-commerce brands,
            and support-heavy businesses.
          </p>
        </section>

        <section className="section" id="services">
          <div className="section-heading">
            <p className="eyebrow">What 3Beeez offers</p>
            <h2>High-trust AI chat that feels like part of your client&apos;s team.</h2>
          </div>
          <div className="feature-grid">
            <article className="feature-card">
              <h3>AI chat for customer websites</h3>
              <p>
                We create a website chatbot that can answer product, policy,
                onboarding, and support questions in a natural conversational
                style.
              </p>
            </article>
            <article className="feature-card">
              <h3>Knowledge ingestion</h3>
              <p>
                Clients can provide files, help-center content, SOPs, webpages,
                and business documents so the assistant answers from real
                company knowledge.
              </p>
            </article>
            <article className="feature-card">
              <h3>Easy embed script</h3>
              <p>
                We provide a script snippet that companies can place on their
                website to launch the chat widget without a complicated rebuild.
              </p>
            </article>
            <article className="feature-card">
              <h3>Human-like response flow</h3>
              <p>
                The experience is designed to respond quickly, keep context, and
                guide visitors toward booking, buying, or getting support.
              </p>
            </article>
          </div>
        </section>

        <section className="section split-section" id="platform">
          <div className="section-heading compact">
            <p className="eyebrow">Platform model</p>
            <h2>From client content to embedded AI support in three steps.</h2>
          </div>
          <div className="timeline">
            <article className="timeline-step">
              <span className="step-number">01</span>
              <h3>Collect the source data</h3>
              <p>
                Bring in websites, PDFs, policies, product pages, onboarding
                docs, or support articles to shape the assistant&apos;s knowledge
                base.
              </p>
            </article>
            <article className="timeline-step">
              <span className="step-number">02</span>
              <h3>Configure brand and behavior</h3>
              <p>
                Set tone, allowed topics, escalation paths, contact capture, and
                brand styling so the bot reflects the company&apos;s voice.
              </p>
            </article>
            <article className="timeline-step">
              <span className="step-number">03</span>
              <h3>Launch with one script tag</h3>
              <p>
                Add the widget to the client website and let visitors start
                chatting immediately with AI grounded in company information.
              </p>
            </article>
          </div>
          <div className="code-card">
            <div className="code-card-header">
              <span>Embed snippet preview</span>
              <span>Client website</span>
            </div>
            <pre>
              <code>{`<script
  src="https://cdn.3beeez.com/widget.js"
  data-bot-id="acme-support"
  data-theme="midnight"
  data-position="bottom-right">
</script>`}</code>
            </pre>
          </div>
        </section>

        <section className="section demo-section" id="demo">
          <div className="section-heading">
            <p className="eyebrow">Interactive concept demo</p>
            <h2>What the customer experience can feel like.</h2>
            <p>
              This demo uses sample prompts to show the kind of live responses
              your clients could offer on their own websites. Messages and
              visitor details entered here are now stored for the admin view.
            </p>
          </div>

          <ChatDemo
            botId="3beeez-main"
            companyName="3Beeez"
            companySlug="3beeez"
            promptChips={promptChips}
          />
        </section>

        <section className="section value-section">
          <div className="section-heading compact">
            <p className="eyebrow">Use cases</p>
            <h2>
              Built for companies that need fast answers without growing a large
              support team.
            </h2>
          </div>
          <div className="value-grid">
            <article>
              <strong>Support deflection</strong>
              <p>
                Answer repetitive website questions instantly and reduce manual
                ticket volume.
              </p>
            </article>
            <article>
              <strong>Lead qualification</strong>
              <p>
                Guide visitors toward contact forms, demos, and sales
                conversations.
              </p>
            </article>
            <article>
              <strong>Service automation</strong>
              <p>
                Provide AI-powered guidance on products, workflows, pricing, and
                onboarding.
              </p>
            </article>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="section-heading">
            <p className="eyebrow">Purchase options</p>
            <h2>Mock checkout locally, real checkout in production.</h2>
            <p>
              These plans currently route into a local mocked purchase flow. In
              production, the same checkout route can redirect into your real
              online payment provider.
            </p>
          </div>
          <div className="pricing-grid">
            {purchasePlans.map((plan) => (
              <article className="pricing-card" key={plan.id}>
                <p className="pricing-tier">{plan.name}</p>
                <h3>{plan.priceLabel}</h3>
                <p className="pricing-description">{plan.description}</p>
                <ul className="pricing-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a
                  className="button button-primary"
                  href={`/purchase?plan=${plan.id}`}
                >
                  Choose {plan.name}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="section cta-section" id="launch">
          <div className="cta-panel">
            <p className="eyebrow">Launch 3beeez.com</p>
            <h2>
              Start with a strong website now, then connect hosting when
              you&apos;re ready.
            </h2>
            <p>
              This first version gives you a polished landing page for your AI
              chat service. Once you buy hosting, we can deploy it and add
              contact forms, analytics, a real chatbot backend, and live
              payments.
            </p>
            <div className="purchase-actions">
              <a className="button button-primary" href="/purchase?plan=monthly">
                Mock a purchase
              </a>
              <a className="button button-secondary" href="mailto:hello@3beeez.com">
                hello@3beeez.com
              </a>
            </div>
          </div>
        </section>
      </main>

    </div>

    {threeBeeezCompany ? (
      <FloatingChatButton botId={threeBeeezCompany.botId} origin={origin} />
    ) : null}
    </>
  );
}
