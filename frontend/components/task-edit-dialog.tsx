/**
 * Task Edit Dialog
 *
 * Full-featured edit dialog for tasks with pre-populated fields.
 * Supports editing title, description, priority, tags, due date, and recurrence.
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksApi, type Task, type TaskUpdate } from "@/lib/api";
import { taskToasts } from "@/lib/toast";
import { X, Target, Calendar, BarChart3, Tag, Repeat } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface TaskEditDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (task: Task) => void;
}

const RECURRENCE_OPTIONS = [
  { value: "", label: "No Recurrence" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

const WEEKDAY_OPTIONS = [
  { value: "MO", label: "Monday" },
  { value: "TU", label: "Tuesday" },
  { value: "WE", label: "Wednesday" },
  { value: "TH", label: "Thursday" },
  { value: "FR", label: "Friday" },
  { value: "SA", label: "Saturday" },
  { value: "SU", label: "Sunday" },
] as const;

export function TaskEditDialog({ task, isOpen, onClose, onTaskUpdated }: TaskEditDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [tags, setTags] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      setTags(task.tags?.join(", ") || "");
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");

      // Parse existing recurrence rule
      if (task.recurrence_rule) {
        const rrule = task.recurrence_rule;
        if (rrule.includes("DAILY")) {
          setRecurrenceType("DAILY");
          const match = rrule.match(/INTERVAL=(\d+)/);
          setRecurrenceInterval(match ? match[1] : "1");
        } else if (rrule.includes("WEEKLY")) {
          setRecurrenceType("WEEKLY");
          const match = rrule.match(/INTERVAL=(\d+)/);
          setRecurrenceInterval(match ? match[1] : "1");
          // Parse BYDAY
          const bydayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
          if (bydayMatch) {
            setRecurrenceWeekdays(bydayMatch[1].split(","));
          }
        } else if (rrule.includes("MONTHLY")) {
          setRecurrenceType("MONTHLY");
          const match = rrule.match(/INTERVAL=(\d+)/);
          setRecurrenceInterval(match ? match[1] : "1");
        } else if (rrule.includes("YEARLY")) {
          setRecurrenceType("YEARLY");
        }
      } else {
        setRecurrenceType("");
        setRecurrenceInterval("1");
        setRecurrenceWeekdays([]);
      }
    }
  }, [task]);

  const handleWeekdayToggle = (day: string) => {
    setRecurrenceWeekdays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const generateRRule = (): string | undefined => {
    if (!recurrenceType) return undefined;

    const interval = parseInt(recurrenceInterval) || 1;
    const parts = [`FREQ=${recurrenceType}`, `INTERVAL=${interval}`];

    if (recurrenceType === "WEEKLY" && recurrenceWeekdays.length > 0) {
      parts.push(`BYDAY=${recurrenceWeekdays.join(",")}`);
    }

    return parts.join(";");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setIsSubmitting(true);
    try {
      const taskData: TaskUpdate = {
        title,
        description: description || undefined,
        priority,
        tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        due_date: dueDate || undefined,
        recurrence_rule: generateRRule(),
      };

      const updatedTask = await tasksApi.put(task.id, taskData);
      onTaskUpdated?.(updatedTask);
      onClose();
      taskToasts.updated(updatedTask.title);
    } catch (err) {
      taskToasts.error("update task", err instanceof Error ? err.message : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "border border-white/20 focus:border-white/60 focus:ring-4 focus:ring-white/5 transition-all duration-300";

  if (!task || !isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white tracking-tightest uppercase">
                Edit Objective
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl hover:bg-danger/10 text-white/60 hover:text-danger border border-white/10 hover:border-danger/20 transition-all duration-300"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 ml-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="E.g., Quarterly Growth Strategy"
                className={inputClasses}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 ml-2">Context (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Outline the core requirements..."
                className={cn(
                  "w-full px-5 py-4 rounded-2xl bg-surface/40 text-white placeholder:text-white/20 outline-none resize-none text-sm font-light leading-relaxed",
                  inputClasses
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 ml-2 flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" /> Priority
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                    className={cn(
                      "w-full px-5 py-3.5 rounded-2xl bg-surface/40 text-white text-sm font-bold appearance-none cursor-pointer outline-none",
                      inputClasses
                    )}
                  >
                    <option value="low" className="bg-slate-900">Low Intensity</option>
                    <option value="medium" className="bg-slate-900">Standard Flow</option>
                    <option value="high" className="bg-slate-900">Critical Zenith</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 ml-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Deadline
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={cn("font-bold text-white", inputClasses)}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 ml-2 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Categorization
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Work, Strategy, Personal (comma separated)"
                className={inputClasses}
              />
            </div>

            {/* Recurrence Section */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/60">
                <Repeat className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recurrence Pattern</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {RECURRENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurrenceType(opt.value)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all",
                      recurrenceType === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {recurrenceType && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Interval */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 whitespace-nowrap">
                      Repeat every
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      className={cn(
                        "w-20 px-3 py-2 rounded-xl bg-surface/40 text-white text-sm font-bold text-center outline-none",
                        inputClasses
                      )}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                      {recurrenceType === "DAILY" ? "day(s)" :
                       recurrenceType === "WEEKLY" ? "week(s)" :
                       recurrenceType === "MONTHLY" ? "month(s)" : "year(s)"}
                    </span>
                  </div>

                  {/* Weekday selector for weekly recurrence */}
                  {recurrenceType === "WEEKLY" && (
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleWeekdayToggle(day.value)}
                          className={cn(
                            "w-10 h-10 rounded-lg border text-xs font-bold uppercase transition-all",
                            recurrenceWeekdays.includes(day.value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                          )}
                        >
                          {day.label.charAt(0)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-2 h-12"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
