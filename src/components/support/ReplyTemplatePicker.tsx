import { useMemo, useState } from "react";
import { BookText, Search, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  REPLY_TEMPLATES,
  TEMPLATE_CATEGORY_LABEL,
  fillTemplate,
  suggestedTemplates,
  type ReplyTemplate,
  type TemplateVars,
} from "@/features/support/replyTemplates";

interface ReplyTemplatePickerProps {
  category?: string;
  vars: TemplateVars;
  onInsert: (text: string) => void;
  disabled?: boolean;
}

const CATEGORY_ORDER: ReplyTemplate["category"][] = [
  "GENERAL",
  "DEPOSITS",
  "WITHDRAWALS",
  "VERIFICATION",
  "ACCOUNTS",
  "TECHNICAL",
  "OTHERS",
];

export function ReplyTemplatePicker({
  category,
  vars,
  onInsert,
  disabled,
}: ReplyTemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  // The ticket's own category leads; general replies follow.
  const quick = useMemo(() => suggestedTemplates(category).slice(0, 4), [category]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REPLY_TEMPLATES.filter(
      (t) => !q || t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
    );
  }, [query]);

  const preview =
    filtered.find((t) => t.id === previewId) ?? filtered[0] ?? null;

  const insert = (t: ReplyTemplate) => {
    onInsert(fillTemplate(t.body, vars));
    setOpen(false);
    setQuery("");
  };

  const ticketCategory = (category ?? "").toUpperCase();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-amber-500" />
        Quick replies
      </span>
      {quick.map((t) => (
        <button
          key={t.id}
          type="button"
          disabled={disabled}
          onClick={() => insert(t)}
          title={fillTemplate(t.body, vars)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
            t.category === ticketCategory
              ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
              : "border-border bg-background text-muted-foreground hover:text-foreground"
          )}
        >
          {t.title}
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-7 gap-1 rounded-full px-2.5 text-[11px]"
          >
            <BookText className="h-3.5 w-3.5" />
            All templates
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-[min(92vw,720px)] p-0">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search templates…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-[260px_1fr]">
            <ScrollArea className="h-80 border-r">
              <div className="space-y-3 p-2">
                {CATEGORY_ORDER.map((cat) => {
                  const items = filtered.filter((t) => t.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <p className="flex items-center gap-1 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {TEMPLATE_CATEGORY_LABEL[cat]}
                        {cat === ticketCategory && (
                          <Sparkles className="h-3 w-3 text-primary" aria-label="Matches this ticket" />
                        )}
                      </p>
                      {items.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onMouseEnter={() => setPreviewId(t.id)}
                          onFocus={() => setPreviewId(t.id)}
                          onClick={() => insert(t)}
                          className={cn(
                            "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                            preview?.id === t.id
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="p-4 text-center text-xs text-muted-foreground">No templates match.</p>
                )}
              </div>
            </ScrollArea>

            <div className="hidden flex-col md:flex">
              {preview ? (
                <>
                  <ScrollArea className="h-[17rem]">
                    <p className="whitespace-pre-wrap p-4 text-xs leading-relaxed text-foreground">
                      {fillTemplate(preview.body, vars)}
                    </p>
                  </ScrollArea>
                  <div className="flex justify-end border-t p-2">
                    <Button size="sm" className="h-8 text-xs" onClick={() => insert(preview)}>
                      Use this template
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-80 items-center justify-center text-xs text-muted-foreground">
                  Select a template to preview
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
