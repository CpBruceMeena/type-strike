"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton, SignUpButton, UserButton, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";

export default function ProfilePage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const clerk = useClerk();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await clerk.signOut();
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <TopBar showBack title="PROFILE" />

        {isSignedIn ? (
          <div className="flex flex-col gap-6">
            {/* Identity card */}
            <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-6">
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || "Profile"}
                    className="h-16 w-16 rounded-full border border-white/10 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary text-2xl font-black text-white">
                    {user.firstName?.[0] || user.username?.[0] || "?"}
                  </div>
                )}
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <h2 className="text-lg font-bold text-text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-text-muted">{user.primaryEmailAddress?.emailAddress}</p>
                  <p className="text-xs text-text-muted">@{user.username}</p>
                  <p className="text-xs text-text-disabled">
                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "recently"}
                  </p>
                </div>
              </div>
            </div>

            {/* Account actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-5">
                <h3 className="text-xs font-bold tracking-[2px] text-text-label uppercase">Account</h3>
                <p className="mt-2 text-sm text-text-muted">
                  Manage your personal info, connected accounts, and security settings.
                </p>
                <button
                  onClick={handleLogout}
                  className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold tracking-[2px] text-text-body hover:border-red-400/60 hover:text-red-300 transition-colors"
                >
                  LOG OUT
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-5">
                <h3 className="text-xs font-bold tracking-[2px] text-text-label uppercase">Quick Access</h3>
                <p className="mt-2 text-sm text-text-muted">
                  Jump back to your stats, achievements, and daily challenges.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push("/app/stats")}
                    className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold tracking-[2px] text-text-body hover:border-accent-primary/60 hover:text-accent-primary transition-colors"
                  >
                    STATS
                  </button>
                  <button
                    onClick={() => router.push("/app/achievements")}
                    className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold tracking-[2px] text-text-body hover:border-accent-primary/60 hover:text-accent-primary transition-colors"
                  >
                    FEATS
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-bg-surface/80 p-6">
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-sm text-text-muted">Sign in to view and manage your profile.</p>
              <div className="flex gap-3">
                <SignInButton mode="modal">
                  <button className="rounded-xl bg-accent-primary/90 px-4 py-2 text-xs font-bold tracking-[2px] text-white hover:bg-accent-primary transition-colors">
                    SIGN IN
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold tracking-[2px] text-text-body hover:border-accent-primary/60 hover:text-accent-primary transition-colors">
                    SIGN UP
                  </button>
                </SignUpButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
