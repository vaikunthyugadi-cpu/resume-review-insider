import Link from "next/link";

const benefits = [
  ["Targeted feedback", "Get advice shaped around the company and role you want."],
  ["Verified insiders", "Reviews come from professionals who understand the hiring bar."],
  ["Clear next steps", "Receive strengths, improvements, job tips, and an action plan."]
];

export default function Home() {
  return (
    <main className="marketing-page">
      <header className="marketing-nav">
        <Link className="brand brand-dark" href="/">
          <span className="brand-mark">R</span>
          <span>ResumeReview</span>
        </Link>
        <nav>
          <Link className="nav-link" href="/login">Log in</Link>
          <Link className="button button-primary" href="/signup">Create account</Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <div className="hero-copy">
          <p className="eyebrow">Feedback from the inside</p>
          <h1>Build a resume that gets noticed.</h1>
          <p className="hero-lead">
            Connect with verified employees at your target companies and get practical,
            role-specific feedback before you apply.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/signup?role=hunter">
              Get my resume reviewed
            </Link>
            <Link className="button button-secondary button-large" href="/signup?role=reviewer">
              Become a reviewer
            </Link>
          </div>
          <div className="social-proof">
            <div className="avatar-stack"><span>SK</span><span>AM</span><span>JL</span></div>
            <p><strong>Real people.</strong> Useful feedback. Better applications.</p>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card review-preview">
            <span className="card-label">Review completed</span>
            <h3>Product Manager · OpenAI</h3>
            <div className="feedback-line"><i></i><span>Lead with measurable product impact</span></div>
            <div className="feedback-line"><i></i><span>Tighten the opening summary</span></div>
            <div className="feedback-line"><i></i><span>Show clearer ownership</span></div>
            <div className="reviewer-chip">
              <span className="avatar">MW</span>
              <div><strong>Reviewed by Maya</strong><small>Verified company insider</small></div>
              <span className="verified">✓</span>
            </div>
          </div>
          <div className="floating-card score-card">
            <span>Review quality</span><strong>4.9</strong><small>★★★★★</small>
          </div>
        </div>
      </section>

      <section className="benefit-section">
        <div>
          <p className="eyebrow">Why ResumeReview</p>
          <h2>Advice that is relevant to where you are applying.</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map(([title, copy], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
