export const dialogInputClass = [
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-accent",
  "transition-colors",
].join(" ");

export const dialogTextareaClass = `${dialogInputClass} resize-none`;
