import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useTasks } from "../hooks/useTasks";
import { useCreateTask } from "../hooks/useCreateTask";
import { useUpdateTask } from "../hooks/useUpdateTask";
import { useDeleteTask } from "../hooks/useDeleteTask";
import type { TaskResponse, TaskStatus } from "../types";

interface Props {
  projectId: string;
  canEdit: boolean;
}

const columns: { status: TaskStatus; label: string; titleClass: string }[] = [
  { status: "TODO", label: "À faire", titleClass: "text-muted-foreground" },
  { status: "DOING", label: "En cours", titleClass: "text-accent" },
  { status: "DONE", label: "Terminé", titleClass: "text-emerald-500" },
];

function UserAvatar({ username }: { username: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold shrink-0"
      title={username}
    >
      {username.slice(0, 2).toUpperCase()}
    </span>
  );
}

function DraggableCard({
  task,
  canEdit,
  onDelete,
}: {
  task: TaskResponse;
  canEdit: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-surface-elevated border border-border rounded-md p-3 cursor-grab active:cursor-grabbing select-none transition-opacity ${isDragging ? "opacity-40" : ""}`}
    >
      <p className="text-base font-medium text-foreground mb-1 leading-snug">{task.title}</p>
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        {task.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <UserAvatar username={task.assignedTo.username} />
            <span className="text-sm text-muted-foreground">{task.assignedTo.username}</span>
          </div>
        ) : (
          <span />
        )}
        {canEdit && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-muted-foreground/40 hover:text-red-400 text-sm transition-colors"
            title="Supprimer"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function DroppableColumn({
  status,
  label,
  titleClass,
  tasks,
  canEdit,
  projectId,
  onDelete,
}: {
  status: TaskStatus;
  label: string;
  titleClass: string;
  tasks: TaskResponse[];
  canEdit: boolean;
  projectId: string;
  onDelete: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [newTitle, setNewTitle] = useState("");
  const createTask = useCreateTask(projectId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createTask.mutate({ title: newTitle.trim() }, { onSuccess: () => setNewTitle("") });
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${titleClass}`}>{label}</h3>
        <span className="text-sm text-muted-foreground/60">{tasks.length}</span>
      </div>

      {canEdit && status === "TODO" && (
        <form onSubmit={handleCreate} className="mb-1">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nouvelle tâche…"
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </form>
      )}
      {canEdit && status !== "TODO" && (
        <div className="mb-1 h-[38px]" />
      )}

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-48 rounded-md p-2 transition-colors ${isOver ? "bg-accent/10 border border-accent/30" : "bg-surface border border-border"}`}
      >
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            canEdit={canEdit}
            onDelete={() => onDelete(task.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function TaskKanban({ projectId, canEdit }: Props) {
  const { data: tasks = [] } = useTasks(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || !canEdit) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    updateTask.mutate({ taskId, data: { status: newStatus } });
  };

  const byStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4">
        {columns.map(({ status, label, titleClass }) => (
          <DroppableColumn
            key={status}
            status={status}
            label={label}
            titleClass={titleClass}
            tasks={byStatus(status)}
            canEdit={canEdit}
            projectId={projectId}
            onDelete={(taskId) => deleteTask.mutate(taskId)}
          />
        ))}
      </div>
    </DndContext>
  );
}
