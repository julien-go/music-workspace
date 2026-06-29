import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMembers } from "../hooks/useMembers";
import { useUpdateMemberRole } from "../hooks/useUpdateMemberRole";
import { useRemoveMember } from "../hooks/useRemoveMember";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { useAuthStore } from "@/store/authStore";
import { type ProjectRole, ROLE_LABEL, ROLE_CLASS } from "../types";

interface Props {
  projectId: string;
  isOwner: boolean;
}


function MemberAvatar({ username }: { username: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-accent/20 text-accent text-sm font-bold flex items-center justify-center shrink-0">
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function MembersSidebar({ projectId, isOwner }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const { data: members, isLoading } = useMembers(projectId);
  const updateRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);
  const currentUser = useAuthStore((s) => s.user);

  const sortedMembers = members
    ? [...members].sort((a, b) => {
        if (a.role === "OWNER") return -1;
        if (b.role === "OWNER") return 1;
        return 0;
      })
    : [];

  const handleRemoveConfirm = (userId: string) => {
    setPendingRemoveId(userId);
    removeMember.mutate(userId, {
      onSuccess: () => {
        setConfirmingRemoveId(null);
        setPendingRemoveId(null);
      },
      onError: () => setPendingRemoveId(null),
    });
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground text-base">Membres</h2>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            className="text-sm h-8 px-3 text-accent hover:text-accent/80"
            onClick={() => setInviteOpen(true)}
          >
            + Inviter
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-border" />
              <div className="flex-1 h-3 bg-border rounded" />
            </div>
          ))}
        </div>
      )}

      {sortedMembers.length > 0 && (
        <div className="space-y-3">
          {sortedMembers.map((member) => {
            const isCurrentUser = currentUser?.id === member.user.id;
            const canManage = isOwner && member.role !== "OWNER";
            const isConfirming = confirmingRemoveId === member.user.id;

            return (
              <div key={member.user.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <MemberAvatar username={member.user.username} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-foreground truncate">
                      {member.user.username}
                      {isCurrentUser && (
                        <span className="text-muted-foreground text-sm ml-1">(vous)</span>
                      )}
                    </p>
                    {canManage ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          updateRole.mutate({
                            userId: member.user.id,
                            role: e.target.value as Exclude<ProjectRole, "OWNER">,
                          })
                        }
                        disabled={updateRole.isPending}
                        className="text-sm text-muted-foreground bg-transparent border-none focus:outline-none cursor-pointer mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="COLLABORATOR">Collaborateur</option>
                        <option value="VIEWER">Lecteur</option>
                      </select>
                    ) : (
                      <Badge variant="outline" className={`text-sm mt-0.5 ${ROLE_CLASS[member.role]}`}>
                        {ROLE_LABEL[member.role]}
                      </Badge>
                    )}
                  </div>
                  {canManage && !isConfirming && (
                    <button
                      onClick={() => setConfirmingRemoveId(member.user.id)}
                      className="text-muted-foreground/50 hover:text-red-400 transition-colors text-sm shrink-0"
                      title="Retirer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {isConfirming && (
                  <div className="ml-12 flex flex-col gap-1.5 bg-surface-elevated rounded-md p-2">
                    <p className="text-sm text-muted-foreground">Retirer ce membre ?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmingRemoveId(null)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleRemoveConfirm(member.user.id)}
                        disabled={pendingRemoveId === member.user.id}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
                      >
                        {pendingRemoveId === member.user.id ? "…" : "Confirmer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <InviteMemberDialog
        projectId={projectId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}
