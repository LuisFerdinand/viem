import { ArrowUpRight, LogOut } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { PdfUploader } from "@/components/admin/PdfUploader";
import { VideoForm } from "@/components/admin/VideoForm";
import { Logo } from "@/components/ui/Logo";
import { logoutAction } from "@/lib/admin/actions";
import { isAdmin, isAdminConfigured } from "@/lib/admin/auth";
import { db } from "@/lib/db/client";
import { getSiteContent } from "@/lib/settings";
import { youTubeWatchUrl } from "@/lib/youtube";

export default async function AdminPage() {
  if (!isAdminConfigured()) return <SetupNeeded />;
  if (!(await isAdmin())) return <SignIn />;

  const content = await getSiteContent();
  const uploadsReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <>
      <header className="border-b border-forest-100 bg-white">
        <div className="container-page flex h-18 items-center justify-between gap-4">
          <Link href="/" aria-label="VIEM home">
            <Logo tone="dark" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-forest-700 hover:bg-forest-100"
            >
              View site <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-forest-200 px-4 text-sm font-medium text-forest-800 hover:bg-forest-50"
              >
                <LogOut className="size-4" aria-hidden="true" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page max-w-3xl space-y-6 py-12">
        <div>
          <p className="eyebrow text-forest-500">Admin</p>
          <h1 className="mt-2 font-display text-4xl font-medium text-forest-900">Website content</h1>
          <p className="mt-3 text-muted">
            Changes go live straight away. PDFs open in a viewer on the website instead of downloading.
          </p>
        </div>

        {(!uploadsReady || !db) && (
          <div className="rounded-2xl border border-warn-500/40 bg-warn-50 p-5 text-sm text-warn-700">
            <p className="font-semibold">Finish the setup to save changes</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {!db && <li>Add <code>DATABASE_URL</code> and run <code>npm run db:migrate</code>.</li>}
              {!uploadsReady && (
                <li>
                  Create a Blob store in Vercel (Storage → Blob) and set <code>BLOB_READ_WRITE_TOKEN</code>. PDF uploads need it.
                </li>
              )}
            </ul>
          </div>
        )}

        <VideoForm initialUrl={content.introVideoId ? youTubeWatchUrl(content.introVideoId) : ""} />

        <PdfUploader
          docKey="proposal"
          title="Proposal PDF"
          hint="Shown in the viewer from the home page, the menu, the footer and the Proposal page."
          current={content.documents.proposal}
          uploadsReady={uploadsReady && Boolean(db)}
        />
        <PdfUploader
          docKey="profile"
          title="Company profile PDF"
          hint="Shown in the viewer on the Proposal page and in the proposal banner."
          current={content.documents.profile}
          uploadsReady={uploadsReady && Boolean(db)}
        />
      </main>
    </>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-forest-100 bg-white p-8 shadow-lift">
        <Logo tone="dark" />
        {children}
      </div>
    </div>
  );
}

function SignIn() {
  return (
    <Card>
      <h1 className="mt-8 font-display text-3xl font-medium text-forest-900">Admin sign-in</h1>
      <p className="mt-2 text-sm text-muted">Manage the PDFs and the introduction video on the VIEM website.</p>
      <LoginForm />
    </Card>
  );
}

function SetupNeeded() {
  return (
    <Card>
      <h1 className="mt-8 font-display text-3xl font-medium text-forest-900">Set an admin password</h1>
      <p className="mt-2 text-sm text-muted">
        The admin panel stays locked until a password exists. Add this to <code>.env.local</code> (and to the Vercel
        project&apos;s environment variables), then restart:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-forest-950 p-4 text-sm text-leaf-200">ADMIN_PASSWORD=choose-a-long-password</pre>
      <p className="mt-3 text-xs text-muted">At least 8 characters.</p>
    </Card>
  );
}
