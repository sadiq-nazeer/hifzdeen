"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileData = {
  success?: boolean;
  data?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    createdAt?: string;
    photoUrl?: string;
  };
  error?: string;
  status?: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [status, setStatus] = useState<"loading" | "unauthenticated" | "success" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const res = await fetch("/api/user/profile", { credentials: "same-origin" });
      if (cancelled) return;
      if (res.status === 401) {
        setStatus("unauthenticated");
        return;
      }
      const json = (await res.json()) as ProfileData & { error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setStatus("error");
        setProfile(json);
        return;
      }
      setProfile(json);
      setStatus("success");
    };
    queueMicrotask(() => run());
    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-6 pb-12 pt-4">
        <p className="text-muted-foreground">Loading profile…</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="mx-auto max-w-6xl px-6 pb-12 pt-4">
        <p className="text-muted-foreground">Sign in to view your profile.</p>
        <a
          href="/api/auth/login"
          className="mt-4 inline-block text-brand underline-offset-4 hover:underline"
        >
          Sign in
        </a>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="mx-auto max-w-6xl px-6 pb-12 pt-4">
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        <p className="mt-4 text-muted-foreground">{profile?.error ?? "Unable to load profile."}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Profile requires the &quot;user&quot; or &quot;user.profile.read&quot; scope. Ask Quran
          Foundation to enable it for your client to see name and email here.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          You are still signed in — you can use <Link href="/collections" className="underline">Collections</Link> if that scope is enabled.
        </p>
      </main>
    );
  }

  const d = profile?.data;
  const name = [d?.firstName, d?.lastName].filter(Boolean).join(" ") || null;

  return (
    <main className="mx-auto max-w-6xl px-6 pb-12 pt-4">
      <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
      <div className="mt-6 space-y-2 text-foreground">
        {name && <p><span className="text-muted-foreground">Name:</span> {name}</p>}
        {d?.email && <p><span className="text-muted-foreground">Email:</span> {d.email}</p>}
        {d?.id && <p className="text-sm text-muted-foreground">ID: {d.id}</p>}
        {!name && !d?.email && (
          <p className="text-muted-foreground">
            No profile details returned. If you expected name/email, ask Quran Foundation to enable
            the &quot;user&quot; or &quot;openid&quot; scope for your client.
          </p>
        )}
      </div>
    </main>
  );
}
