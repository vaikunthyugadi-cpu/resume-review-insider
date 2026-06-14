import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ResumeReview",
    template: "%s | ResumeReview"
  },
  description: "Get your resume reviewed by verified insiders at your target company."
};

const themeScript = `
  try {
    const saved = localStorage.getItem("resume-review-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {}
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
