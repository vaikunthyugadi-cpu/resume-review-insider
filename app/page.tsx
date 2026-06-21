import Link from "next/link";

const categories = [
  ["DEV", "Software & IT", "Build a sharper technical story"],
  ["PM", "Product", "Show decisions, impact, and ownership"],
  ["FIN", "Finance", "Present precision and commercial value"],
  ["MKT", "Marketing", "Turn campaigns into clear outcomes"],
  ["DATA", "Data Science", "Make models and insights easy to scan"],
  ["NEW", "Freshers", "Create a confident first impression"]
];

const benefits = [
  ["Company-specific feedback", "Choose the company and role you are targeting, then get advice that matches the hiring bar."],
  ["Verified professionals", "Reviewers share practical experience from inside the companies candidates want to join."],
  ["Clear action plan", "Receive structured strengths, improvements, role tips, and specific next steps."],
  ["Private and secure", "Resume files are stored securely and shared only for the review workflow."]
];

export default function Home() {
  return (
    <main className="marketing-page portal-home">
      <header className="marketing-nav portal-nav">
        <Link className="brand brand-dark" href="/"><span className="brand-mark">R</span><span>ResumeReview</span></Link>
        <nav className="portal-links">
          <a className="nav-link" href="#how-it-works">How it works</a>
          <Link className="nav-link" href="/signup?role=reviewer">For reviewers</Link>
          <Link className="button button-outline" href="/login">Log in</Link>
          <Link className="button button-accent" href="/signup">Register</Link>
        </nav>
      </header>

      <section className="portal-hero">
        <div className="portal-hero-copy">
          <span className="portal-kicker">Resume feedback from verified company professionals</span>
          <h1>Turn your resume into a stronger career story.</h1>
          <p>Get focused, role-specific resume feedback before you apply to the companies you care about.</p>
          <div className="portal-search" role="group" aria-label="Start a resume review">
            <div><span className="search-icon">01</span><strong>Target role or company</strong><small>Product Manager, Software Engineer...</small></div>
            <div><span className="search-icon">02</span><strong>Upload your resume</strong><small>PDF or Word document</small></div>
            <Link className="button button-primary portal-search-button" href="/signup?role=hunter">Get reviewed</Link>
          </div>
          <p className="portal-trust"><span>✓</span> Secure files <span>✓</span> Verified reviewers <span>✓</span> Actionable feedback</p>
        </div>

        <div className="portal-hero-art" aria-hidden="true">
          <div className="career-board">
            <div className="career-board-head"><span>Resume workspace</span><b>LIVE</b></div>
            <div className="career-profile">
              <span className="career-avatar">AK</span>
              <div><strong>Product candidate</strong><small>Targeting a high-growth team</small></div>
              <span className="career-score">8.7</span>
            </div>
            <div className="career-progress"><span></span></div>
            <div className="career-insights">
              <article><i>01</i><div><strong>Impact</strong><small>Add measurable outcomes</small></div></article>
              <article><i>02</i><div><strong>Clarity</strong><small>Tighten the opening summary</small></div></article>
              <article><i>03</i><div><strong>Fit</strong><small>Match the target role</small></div></article>
            </div>
          </div>
          <div className="floating-note note-one"><span>CV</span><strong>Resume ready</strong></div>
          <div className="floating-note note-two"><span>7+</span><strong>Actionable tips</strong></div>
          <div className="floating-note note-three"><span>OK</span><strong>Verified reviewer</strong></div>
        </div>
      </section>

      <section className="portal-section portal-categories">
        <div className="portal-section-heading">
          <div><span className="eyebrow">Explore by career path</span><h2>Feedback designed around where you are going</h2></div>
          <Link href="/signup?role=hunter">View all options <span aria-hidden="true">-&gt;</span></Link>
        </div>
        <div className="category-grid">
          {categories.map(([code, title, copy], index) => (
            <Link href="/signup?role=hunter" className={`category-card category-tone-${index + 1}`} key={title}>
              <span className="category-icon">{code}</span><strong>{title}</strong><small>{copy}</small><b aria-hidden="true">+</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="portal-banner">
        <div><span className="eyebrow">Need help with your resume?</span><h2>Get expert feedback from people who understand your target company.</h2><p>Submit once, track progress online, and receive a structured review.</p></div>
        <Link className="button button-primary button-large" href="/signup?role=hunter">Submit your resume</Link>
      </section>

      <section className="portal-section" id="how-it-works">
        <div className="portal-section-heading"><div><span className="eyebrow">Why ResumeReview</span><h2>A practical advantage before you apply</h2></div></div>
        <div className="benefit-grid portal-benefits">{benefits.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="portal-cta"><div><h2>Share experience. Help candidates. Earn from every review.</h2><p>Join as a Reviewer and support applicants targeting your company.</p></div><Link className="button button-secondary button-large" href="/signup?role=reviewer">Become a reviewer</Link></section>

      <footer className="portal-footer"><Link className="brand brand-light" href="/"><span className="brand-mark">R</span><span>ResumeReview</span></Link><p>Professional resume feedback from verified insiders.</p><div><Link href="/login">Log in</Link><Link href="/signup">Register</Link><Link href="/admin/login">Admin</Link></div></footer>
    </main>
  );
}
