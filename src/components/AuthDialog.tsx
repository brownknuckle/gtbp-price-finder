import { useState } from "react";
import { LogIn, LogOut, User, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const AuthDialog = () => {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      toast({ title: "Sign in failed", description: e.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    toast({ title: "Signed out" });
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => { setEmail(""); setSent(false); }, 300);
    }
  };

  if (loading) {
    return (
      <button className="rounded-md p-2.5 text-primary-foreground/70">
        <User className="h-4 w-4 animate-pulse" />
      </button>
    );
  }

  if (user) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="h-5 w-5 rounded-full" />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="hidden sm:inline max-w-[120px] truncate">
              {user.user_metadata?.full_name || user.email?.split("@")[0] || "Account"}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Your Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" className="h-10 w-10 rounded-full" />
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{user.user_metadata?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in to GTBP</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="h-10 w-10 text-primary" />
            <p className="font-semibold text-foreground">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>.
              Click the link in the email to sign in.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Enter your email — we'll send you a sign-in link. No password needed.
              </p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={sending || !email.trim()}>
              {sending ? "Sending…" : "Send Sign-In Link"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <a href="/terms" className="underline hover:text-primary">terms of service</a>.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
