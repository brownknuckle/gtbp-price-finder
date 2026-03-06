import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Megaphone,
  List,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ImageIcon,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  X,
} from "lucide-react";
import PageTransition from "@/components/PageTransition";

// ─── Admin access ────────────────────────────────────────────────────────────
// Add admin email addresses here (or set VITE_ADMIN_EMAILS env var as comma-separated list)
const ADMIN_EMAILS: string[] = (
  import.meta.env.VITE_ADMIN_EMAILS ?? ""
)
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  // If no admin emails configured, allow any authenticated user (dev mode)
  if (ADMIN_EMAILS.length === 0) return true;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Platform = "instagram" | "facebook" | "tiktok" | "google";
type Format = "feed" | "story" | "carousel" | "banner";
type Status = "draft" | "active" | "paused" | "archived";

interface Ad {
  id: string;
  name: string;
  platform: Platform;
  format: Format;
  headline: string | null;
  description: string | null;
  cta_text: string | null;
  cta_url: string | null;
  image_url: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google: "Google",
};

const FORMAT_OPTIONS: Record<Platform, { value: Format; label: string }[]> = {
  instagram: [
    { value: "feed", label: "Feed Post" },
    { value: "story", label: "Story" },
    { value: "carousel", label: "Carousel" },
  ],
  facebook: [
    { value: "feed", label: "Feed Post" },
    { value: "carousel", label: "Carousel" },
    { value: "banner", label: "Banner" },
  ],
  tiktok: [
    { value: "feed", label: "In-Feed Ad" },
    { value: "story", label: "TopView Story" },
  ],
  google: [
    { value: "banner", label: "Display Banner" },
    { value: "carousel", label: "Responsive Ad" },
  ],
};

const STATUS_COLORS: Record<Status, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

// ─── Default form state ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  platform: "instagram" as Platform,
  format: "feed" as Format,
  headline: "",
  description: "",
  cta_text: "Shop Now",
  cta_url: "",
  image_url: "",
  status: "draft" as Status,
};

// ─── Ad Preview ───────────────────────────────────────────────────────────────
function AdPreview({ form }: { form: typeof EMPTY_FORM }) {
  const { platform, format, headline, description, cta_text, image_url } = form;

  const hasImage = Boolean(image_url);

  if (platform === "instagram" && format === "story") {
    return (
      <div className="flex flex-col items-center">
        <p className="mb-2 text-xs text-muted-foreground">Instagram Story</p>
        <div className="relative flex w-40 flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-xl" style={{ height: "284px" }}>
          {/* Story image */}
          <div className="flex-1 bg-zinc-800">
            {hasImage ? (
              <img src={image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-8 w-8 text-zinc-600" />
              </div>
            )}
          </div>
          {/* Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
            <p className="text-xs font-semibold text-white line-clamp-1">{headline || "Your headline"}</p>
            <p className="mt-0.5 text-[10px] text-white/70 line-clamp-2">{description || "Your ad description"}</p>
            <div className="mt-2 flex items-center justify-center rounded-full bg-white px-3 py-1">
              <span className="text-[10px] font-bold text-zinc-900">{cta_text || "Shop Now"}</span>
            </div>
          </div>
          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 flex items-center gap-1.5 p-2">
            <div className="h-0.5 flex-1 rounded-full bg-white/40" />
            <div className="h-0.5 flex-1 rounded-full bg-white/80" />
            <div className="h-0.5 flex-1 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    );
  }

  if (platform === "google" && format === "banner") {
    return (
      <div className="flex flex-col items-center">
        <p className="mb-2 text-xs text-muted-foreground">Google Display Banner</p>
        <div className="flex w-full max-w-sm items-center overflow-hidden rounded-lg border bg-white shadow">
          {hasImage ? (
            <img src={image_url} alt="" className="h-20 w-24 object-cover" />
          ) : (
            <div className="flex h-20 w-24 items-center justify-center bg-zinc-100">
              <ImageIcon className="h-6 w-6 text-zinc-400" />
            </div>
          )}
          <div className="flex flex-1 flex-col justify-center gap-1 px-3 py-2">
            <p className="text-xs font-bold text-zinc-900 line-clamp-1">{headline || "Your headline"}</p>
            <p className="text-[10px] text-zinc-500 line-clamp-2">{description || "Ad description"}</p>
          </div>
          <div className="mr-3">
            <div className="rounded bg-primary px-2 py-1">
              <span className="text-[10px] font-bold text-primary-foreground">{cta_text || "Shop Now"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (format === "carousel") {
    return (
      <div className="flex flex-col items-center">
        <p className="mb-2 text-xs text-muted-foreground">{PLATFORM_LABELS[platform]} Carousel</p>
        <div className="w-full max-w-xs overflow-hidden rounded-xl border bg-white shadow">
          {/* Header */}
          <div className="flex items-center gap-2 p-2">
            <div className="h-6 w-6 rounded-full bg-zinc-200" />
            <span className="text-[11px] font-semibold text-zinc-800">gtbp_official</span>
            <span className="ml-auto text-[10px] text-blue-500 font-medium">Sponsored</span>
          </div>
          {/* Carousel strip */}
          <div className="flex gap-1 overflow-hidden px-2 pb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative flex-none">
                <div className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-md ${i === 0 && hasImage ? "" : "bg-zinc-100"}`}>
                  {i === 0 && hasImage ? (
                    <img src={image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-zinc-400" />
                  )}
                </div>
                {i === 0 && (
                  <div className="mt-1">
                    <p className="text-[9px] font-semibold text-zinc-900 line-clamp-1">{headline || "Headline"}</p>
                    <p className="text-[8px] text-zinc-500 line-clamp-1">{cta_text || "Shop Now"} →</p>
                  </div>
                )}
              </div>
            ))}
            <div className="flex flex-none items-center pl-1">
              <ChevronRight className="h-5 w-5 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Feed post (Instagram / Facebook)
  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-xs text-muted-foreground">{PLATFORM_LABELS[platform]} Feed</p>
      <div className="w-full max-w-xs overflow-hidden rounded-xl border bg-white shadow">
        {/* Post header */}
        <div className="flex items-center gap-2 p-2.5">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60" />
          <div>
            <p className="text-[11px] font-semibold text-zinc-900">gtbp_official</p>
            <p className="text-[9px] text-zinc-500">Sponsored</p>
          </div>
          <MoreHorizontal className="ml-auto h-4 w-4 text-zinc-400" />
        </div>
        {/* Image */}
        <div className="aspect-square w-full bg-zinc-100">
          {hasImage ? (
            <img src={image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-10 w-10 text-zinc-300" />
            </div>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3 px-2.5 pt-2">
          <Heart className="h-4 w-4 text-zinc-700" />
          <MessageCircle className="h-4 w-4 text-zinc-700" />
          <Send className="h-4 w-4 text-zinc-700" />
          <Bookmark className="ml-auto h-4 w-4 text-zinc-700" />
        </div>
        {/* Caption */}
        <div className="px-2.5 pb-3 pt-1.5">
          <p className="text-[11px] font-semibold text-zinc-900 line-clamp-1">{headline || "Your headline"}</p>
          <p className="mt-0.5 text-[10px] text-zinc-600 line-clamp-2">{description || "Your ad description will appear here."}</p>
          {/* CTA */}
          <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5">
            <span className="text-[10px] font-medium text-zinc-700">gtbp.co.uk</span>
            <div className="rounded bg-primary px-2 py-0.5">
              <span className="text-[9px] font-bold text-primary-foreground">{cta_text || "Shop Now"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ad Builder Form ──────────────────────────────────────────────────────────
function AdBuilderForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Ad;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          platform: initial.platform,
          format: initial.format,
          headline: initial.headline ?? "",
          description: initial.description ?? "",
          cta_text: initial.cta_text ?? "Shop Now",
          cta_url: initial.cta_url ?? "",
          image_url: initial.image_url ?? "",
          status: initial.status,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const formatOptions = FORMAT_OPTIONS[form.platform];

  // If current format not available for new platform, reset it
  const handlePlatformChange = (val: string) => {
    const p = val as Platform;
    const opts = FORMAT_OPTIONS[p];
    const fmt = opts.find((o) => o.value === form.format) ? form.format : opts[0].value;
    setForm((f) => ({ ...f, platform: p, format: fmt }));
  };

  const handleSave = async (status: Status) => {
    if (!form.name.trim()) {
      toast({ title: "Campaign name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        platform: form.platform,
        format: form.format,
        headline: form.headline || null,
        description: form.description || null,
        cta_text: form.cta_text || "Shop Now",
        cta_url: form.cta_url || null,
        image_url: form.image_url || null,
        status,
      };

      const { error } = initial
        ? await supabase.from("ads").update(payload).eq("id", initial.id)
        : await supabase.from("ads").insert(payload);

      if (error) throw error;

      toast({ title: initial ? "Ad updated" : "Ad created", description: `Saved as ${status}` });
      onSaved();
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── Form ── */}
      <div className="space-y-5">
        {onCancel && (
          <button onClick={onCancel} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" /> Cancel editing
          </button>
        )}

        {/* Campaign name */}
        <div className="space-y-1.5">
          <Label htmlFor="ad-name">Campaign Name</Label>
          <Input
            id="ad-name"
            placeholder="e.g. Nike Air Max — Spring 2026"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        {/* Platform + Format */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <Select value={form.platform} onValueChange={handlePlatformChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Format</Label>
            <Select value={form.format} onValueChange={(v) => set("format", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Creative content */}
        <div className="space-y-1.5">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            placeholder="e.g. Find the best price on Nike trainers"
            maxLength={100}
            value={form.headline}
            onChange={(e) => set("headline", e.target.value)}
          />
          <p className="text-right text-[11px] text-muted-foreground">{form.headline.length}/100</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description / Body Copy</Label>
          <Textarea
            id="description"
            placeholder="e.g. Compare prices across 50+ retailers instantly. Save on Nike, Adidas, New Balance and more."
            rows={3}
            maxLength={300}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <p className="text-right text-[11px] text-muted-foreground">{form.description.length}/300</p>
        </div>

        <Separator />

        {/* Image */}
        <div className="space-y-1.5">
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            placeholder="https://..."
            value={form.image_url}
            onChange={(e) => set("image_url", e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Paste a direct image URL. The preview updates automatically.
          </p>
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cta_text">CTA Button Text</Label>
            <Input
              id="cta_text"
              placeholder="Shop Now"
              maxLength={30}
              value={form.cta_text}
              onChange={(e) => set("cta_text", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cta_url">Destination URL</Label>
            <Input
              id="cta_url"
              placeholder="https://gtbp.co.uk/results?q=..."
              value={form.cta_url}
              onChange={(e) => set("cta_url", e.target.value)}
            />
          </div>
        </div>

        {/* Save buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            Save as Draft
          </Button>
          <Button onClick={() => handleSave("active")} disabled={saving}>
            {saving ? "Saving…" : "Save & Activate"}
          </Button>
        </div>
      </div>

      {/* ── Live Preview ── */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Live Preview</p>
        <div className="rounded-xl border bg-zinc-50 p-6">
          <AdPreview form={form} />
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          Indicative preview — final appearance depends on platform rendering
        </p>
      </div>
    </div>
  );
}

// ─── Campaigns Table ──────────────────────────────────────────────────────────
function CampaignsList({ onEdit }: { onEdit: (ad: Ad) => void }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setAds(data as Ad[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("ads").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setAds((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    }
  };

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setAds((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Ad deleted" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Loading campaigns…
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground">
        <Megaphone className="h-6 w-6" />
        No ads yet — create one in the Ad Builder
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => (
            <TableRow key={ad.id}>
              <TableCell className="font-medium">{ad.name}</TableCell>
              <TableCell className="capitalize">{ad.platform}</TableCell>
              <TableCell className="capitalize">{ad.format}</TableCell>
              <TableCell>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[ad.status]}`}>
                  {ad.status}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(ad.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Edit"
                    onClick={() => onEdit(ad)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Select
                    value={ad.status}
                    onValueChange={(v) => updateStatus(ad.id, v as Status)}
                  >
                    <SelectTrigger className="h-7 w-24 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                    title="Delete"
                    onClick={() => {
                      if (confirm(`Delete "${ad.name}"?`)) deleteAd(ad.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState<Record<Status, number>>({
    draft: 0,
    active: 0,
    paused: 0,
    archived: 0,
  });

  useEffect(() => {
    supabase
      .from("ads")
      .select("status")
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<Status, number> = { draft: 0, active: 0, paused: 0, archived: 0 };
        data.forEach((row: { status: Status }) => { counts[row.status]++; });
        setStats(counts);
      });
  }, []);

  const cards = [
    { label: "Active Campaigns", value: stats.active, color: "text-green-600" },
    { label: "Drafts", value: stats.draft, color: "text-zinc-500" },
    { label: "Paused", value: stats.paused, color: "text-amber-600" },
    { label: "Archived", value: stats.archived, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className={`mt-1 text-3xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>→ Use <strong>Instagram Story</strong> format for high-volume awareness at low CPM.</p>
          <p>→ Use <strong>Carousel</strong> to showcase multiple products side-by-side.</p>
          <p>→ <strong>Google Display Banners</strong> are best for retargeting visitors who searched but didn't buy.</p>
          <p>→ Set the destination URL to a pre-filled GTBP search, e.g. <code className="bg-zinc-100 px-1 rounded text-xs">/results?q=Nike+Air+Max+1</code></p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
const Admin = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (!user || !isAdmin(user.email)) {
    return <Navigate to="/" replace />;
  }

  const handleSaved = () => {
    setEditingAd(null);
    setActiveTab("campaigns");
    setRefreshKey((k) => k + 1);
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setActiveTab("builder");
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
              Ad Manager
            </h1>
            <p className="text-sm text-muted-foreground">Build and manage advertising campaigns</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {user.email}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="builder" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {editingAd ? "Edit Ad" : "Ad Builder"}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="builder">
            <AdBuilderForm
              key={editingAd?.id ?? "new"}
              initial={editingAd ?? undefined}
              onSaved={handleSaved}
              onCancel={editingAd ? () => setEditingAd(null) : undefined}
            />
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">All Campaigns</h2>
              <Button size="sm" onClick={() => { setEditingAd(null); setActiveTab("builder"); }}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> New Ad
              </Button>
            </div>
            <CampaignsList key={refreshKey} onEdit={handleEdit} />
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default Admin;
