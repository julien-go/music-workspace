import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInviteMember } from "../hooks/useInviteMember";
import type { InviteMemberRequest, ProjectRole } from "../types";
import { dialogInputClass } from "./dialogStyles";

interface Props {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

type FormData = {
  email: string;
  role: Exclude<ProjectRole, "OWNER">;
};

export function InviteMemberDialog({ projectId, open, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { role: "COLLABORATOR" },
  });
  const inviteMember = useInviteMember(projectId);
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = (data: FormData) => {
    setServerError(null);
    const request: InviteMemberRequest = { email: data.email, role: data.role };
    inviteMember.mutate(request, {
      onSuccess: () => {
        reset();
        onClose();
      },
      onError: (err) => {
        setServerError(err instanceof Error ? err.message : "Utilisateur introuvable ou déjà membre");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-surface ring-border sm:max-w-md p-8 gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Inviter un membre</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Email *</label>
            <input
              {...register("email", {
                required: "L'email est requis",
                pattern: { value: /\S+@\S+\.\S+/, message: "Email invalide" },
              })}
              type="email"
              className={dialogInputClass}
              placeholder="collaborateur@example.com"
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Rôle</label>
            <select
              {...register("role")}
              className={dialogInputClass}
            >
              <option value="COLLABORATOR">Collaborateur</option>
              <option value="VIEWER">Lecteur</option>
            </select>
          </div>
          {serverError && <p className="text-xs text-red-400">{serverError}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Invitation…" : "Inviter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
