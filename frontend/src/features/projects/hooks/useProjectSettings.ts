import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { describeError } from "@/lib/api";
import { useUpdateProject } from "./useUpdateProject";
import { useDeleteProject } from "./useDeleteProject";
import { useUploadCover } from "./useUploadCover";
import type { ProjectResponse, UpdateProjectRequest } from "../types";

export function useProjectSettings(project: ProjectResponse, onClose: () => void) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProjectRequest>({
    defaultValues: { name: project.name, description: project.description ?? "" },
  });
  const updateProject = useUpdateProject(project.id);
  const deleteProject = useDeleteProject();
  const uploadCover = useUploadCover(project.id);
  const navigate = useNavigate();

  const [confirming, setConfirming] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const clearCrop = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const handleClose = () => {
    clearCrop();
    reset({ name: project.name, description: project.description ?? "" });
    updateProject.reset();
    setConfirming(false);
    setEditError(null);
    setDeleteError(null);
    onClose();
  };

  const submit = handleSubmit((data) => {
    setEditError(null);
    updateProject.mutate(data, {
      onError: (err) =>
        setEditError(describeError(err, "Impossible de sauvegarder. Réessaie.")),
    });
  });

  const handleDelete = () => {
    setDeleteError(null);
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        handleClose();
        navigate({ to: "/dashboard" });
      },
      onError: (err) => {
        setDeleteError(
          describeError(err, "Impossible de supprimer le projet. Réessaie."),
        );
        setConfirming(false);
      },
    });
  };

  const pickCoverFile = (file: File) => setCropImageSrc(URL.createObjectURL(file));

  const applyCrop = (file: File) => {
    clearCrop();
    uploadCover.mutate(file);
  };

  return {
    register,
    errors,
    submit,
    updateProject,
    uploadCover,
    deleteProject,
    confirming,
    setConfirming,
    editError,
    deleteError,
    cropImageSrc,
    handleClose,
    handleDelete,
    pickCoverFile,
    clearCrop,
    applyCrop,
  };
}
