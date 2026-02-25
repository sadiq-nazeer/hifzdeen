import { cookies } from "next/headers";
import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { safeGetSession, decodeIdTokenClaims } from "@/lib/auth/session";

const navItems = [
  { href: "/recite", label: "Recite Quran" },
  { href: "/listening", label: "Listen Quran" },
  { href: "/hifz", label: "Memorize Quran" },
  { href: "/zakat", label: "Zakat Calculator" },
];

export async function Header() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const session = safeGetSession(cookieHeader || null);
  const claims = session ? decodeIdTokenClaims(session.idToken) : null;
  const displayName = claims?.name ?? claims?.email ?? null;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/80 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <MobileNav items={navItems} />
          <Link
            href="/"
            className="text-lg font-semibold text-foreground no-underline transition hover:text-brand sm:text-xl"
          >
            HifzDeen.com
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-foreground/80 underline-offset-4 transition hover:text-brand hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {session ? (
            <>
              <Link
                href="/collections"
                className="text-sm text-foreground/80 underline-offset-4 hover:underline"
              >
                Collections
              </Link>
              <Link
                href="/profile"
                className="text-sm text-foreground/80 underline-offset-4 hover:underline"
              >
                Profile
              </Link>
              {displayName && (
                <span className="hidden max-w-[8rem] truncate text-sm text-muted-foreground sm:max-w-[12rem]">
                  {displayName}
                </span>
              )}
              <a
                href="/api/auth/logout"
                className="text-sm text-foreground/80 underline-offset-4 hover:underline"
              >
                Sign out
              </a>
            </>
          ) : (
            <span
              className="cursor-not-allowed text-sm text-foreground/40 underline-offset-4"
              title="Sign in will be available once Quran Foundation enables the required scopes. See docs/setup/user-oauth.md for the email to request them."
            >
              Sign in
            </span>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
