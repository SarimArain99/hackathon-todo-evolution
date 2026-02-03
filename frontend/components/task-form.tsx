/**
 * Zenith Task Creation Engine v2.3
 * Features: OKLCH Semantic System, White-bordered Glass Inputs,
 * Spring-physics transitions, and Recurrence support.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tasksApi, type TaskCreate, type Task } from "@/lib/api";
import { taskToasts } from "@/lib/toast";
import { Plus, X, Target, Calendar, BarChart3, Tag, Repeat } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

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

interface TaskFormProps {
  onTaskCreated?: (task: Task) => void;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [tags, setTags] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [recurrenceType, setRecurrenceType] = useState<string>("");
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>("1");
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate RRULE from recurrence settings
      let recurrenceRule: string | undefined = undefined;
      if (recurrenceType) {
        const interval = parseInt(recurrenceInterval) || 1;
        const parts = [`FREQ=${recurrenceType}`, `INTERVAL=${interval}`];

        if (recurrenceType === "WEEKLY" && recurrenceWeekdays.length > 0) {
          parts.push(`BYDAY=${recurrenceWeekdays.join(",")}`);
        }

        recurrenceRule = parts.join(";");
      }

      const taskData: TaskCreate = {
        title,
        description: description || undefined,
        priority: priority as "low" | "medium" | "high",
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        due_date: dueDate || undefined,
        recurrence_rule: recurrenceRule,
      };

      const newTask = await tasksApi.create(taskData);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTags("");
      setDueDate("");
      setRecurrenceType("");
      setRecurrenceInterval("1");
      setRecurrenceWeekdays([]);
      setShowForm(false);

      onTaskCreated?.(newTask);
      taskToasts.created(newTask.title);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create task";
      taskToasts.error("create task", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWeekdayToggle = (day: string) => {
    setRecurrenceWeekdays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Standardized White Border Utility
  const inputClasses = "border border-white/20 focus:border-white/60 focus:ring-4 focus:ring-white/5 transition-all duration-300";

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="trigger-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Button
              onClick={() => setShowForm(true)}
              className="w-full shadow-2xl shadow-primary/20 h-14 rounded-3xl group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary-foreground/10 group-hover:rotate-90 transition-transform duration-500">
                   <Plus className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-base tracking-tightest font-display uppercase font-black">Define New Objective</span>
              </div>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form-container"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                   <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white tracking-tightest uppercase">
                  Objective
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2.5 rounded-2xl hover:bg-danger/10 text-white/60 hover:text-danger border border-white/10 hover:border-danger/20 transition-all duration-300"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
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

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 ml-2">Context (Optional)</label>
                   <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Outline the core requirements..."
                    className={cn(
                      "w-full px-5 py-4 rounded-2xl bg-surface/40 dark:bg-surface/20 text-white placeholder:text-white/20 outline-none resize-none text-sm font-light leading-relaxed",
                      inputClasses
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 ml-2 flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" /> Priority
                  </label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
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
                       <Plus className="w-4 h-4 rotate-45 text-white" />
                    </div>
                  </div>
                </div>

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
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/60">
                  <Repeat className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Repeat Pattern</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {RECURRENCE_OPTIONS.slice(0, 4).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRecurrenceType(opt.value)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
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
                          "w-16 px-2 py-1.5 rounded-lg bg-surface/40 text-white text-sm font-bold text-center outline-none",
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
                      <div className="flex flex-wrap gap-1.5">
                        {WEEKDAY_OPTIONS.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => handleWeekdayToggle(day.value)}
                            className={cn(
                              "w-9 h-9 rounded-lg border text-[10px] font-bold uppercase transition-all",
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

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 h-14"
                >
                  {isSubmitting ? "Syncing Objective..." : "Create Objective"}
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-14"
                >
                  Discard
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}