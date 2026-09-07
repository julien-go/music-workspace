import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommentThread } from "./CommentThread";
import type { CommentResponse } from "@/features/comments/types";

const comments: CommentResponse[] = [
  {
    id: "c1",
    content: "Great take!",
    author: { id: "user-1", username: "john" },
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "c2",
    content: "Bass too loud",
    author: { id: "user-2", username: "jane" },
    createdAt: "2026-01-01T00:00:00Z",
  },
];

function renderThread(overrides: Partial<Parameters<typeof CommentThread>[0]> = {}) {
  return render(
    <CommentThread
      comments={comments}
      isLoading={false}
      currentUserId="user-1"
      isOwner={false}
      onAdd={vi.fn().mockResolvedValue(undefined)}
      isAdding={false}
      onDelete={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  );
}

describe("CommentThread", () => {
  it("lets a non-owner delete only their own comments", () => {
    renderThread();

    expect(
      screen.getByRole("button", { name: "Supprimer le commentaire de john" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Supprimer le commentaire de jane" }),
    ).not.toBeInTheDocument();
  });

  it("lets the project owner delete every comment", () => {
    renderThread({ isOwner: true });

    expect(
      screen.getByRole("button", { name: "Supprimer le commentaire de john" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Supprimer le commentaire de jane" }),
    ).toBeInTheDocument();
  });

  it("shows an error when deletion fails", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error("boom"));
    renderThread({ onDelete });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Supprimer le commentaire de john" }));

    expect(onDelete).toHaveBeenCalledWith("c1");
    expect(await screen.findByText("Impossible de supprimer ce commentaire.")).toBeInTheDocument();
  });

  it("submits the trimmed draft and clears it on success", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    renderThread({ onAdd });
    const user = userEvent.setup();

    const textarea = screen.getByRole("textbox", { name: "Ajouter un commentaire" });
    await user.type(textarea, "  New comment  ");
    await user.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(onAdd).toHaveBeenCalledWith("New comment");
    expect(textarea).toHaveValue("");
  });

  it("shows an error when posting fails", async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error("boom"));
    renderThread({ onAdd });
    const user = userEvent.setup();

    await user.type(screen.getByRole("textbox", { name: "Ajouter un commentaire" }), "Hello");
    await user.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByText("Impossible d'envoyer le commentaire.")).toBeInTheDocument();
  });

  it("shows a load error instead of the empty state", () => {
    renderThread({ comments: [], loadError: true });

    expect(screen.getByText("Impossible de charger les commentaires.")).toBeInTheDocument();
    expect(screen.queryByText("Aucun commentaire.")).not.toBeInTheDocument();
  });
});
