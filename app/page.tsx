import Link from "next/link";

const categories = ["Software & IT", "Product", "Finance", "Marketing", "Data Science", "Freshers"];
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
          <h1>Make your next application stronger.</h1>
          <p>Get focused, role-specific resume feedback before you apply to the companies you care about.</p>
          <div className="portal-search" role="group" aria-label="Start a resume review">
            <div><span className="search-icon">⌕</span><strong>Target role or company</strong><small>Product Manager, Software Engineer...</small></div>
            <div><span className="search-icon">▣</span><strong>Upload your resume</strong><small>PDF or Word document</small></div>
            <Link className="button button-primary portal-search-button" href="/signup?role=hunter">Get reviewed</Link>
          </div>
          <p className="portal-trust"><span>✓</span> Secure files <span>✓</span> Verified reviewers <span>✓</span> Actionable feedback</p>
        </div>
      </section>

      <section className="portal-section portal-categories">
        <div className="portal-section-heading"><div><span className="eyebrow">Explore by career path</span><h2>Feedback for the role you want</h2></div><Link href="/signup?role=hunter">View all options →</Link></div>
        <div className="category-grid">{categories.map((category, index) => <Link href="/signup?role=hunter" className="category-card" key={category}><span className="category-icon">{["⌘","◆","₹","◉","▥","★"][index]}</span><strong>{category}</strong><small>Role-focused resume reviews</small><b>›</b></Link>)}</div>
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
