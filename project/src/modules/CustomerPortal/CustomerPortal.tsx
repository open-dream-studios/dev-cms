// project/src/modules/CustomerPortal/CustomerPortal.tsx
"use client";

import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Send,
  Calendar,
  Thermometer,
  Droplets,
  Activity,
} from "lucide-react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Message } from "@open-dream/shared";
import { AuthContext } from "@/contexts/authContext";
import { formatDateTime } from "@/util/functions/Time";
import { MiniChat } from "../MessagesModule/MiniChat";

// -----------------------------------------------------------------------------
// Fake Data Models
// -----------------------------------------------------------------------------

type TubStatus = "healthy" | "warning" | "maintenance";

type Tub = {
  id: string;
  name: string;
  temperature: number;
  ph: number;
  status: TubStatus;
  lastService: string;
};

type Job = {
  id: string;
  title: string;
  date: string;
  status: "scheduled" | "in-progress" | "completed";
  notes?: string;
};

const tubs: Tub[] = [
  {
    id: "tub-1",
    name: "Backyard Spa",
    temperature: 101,
    ph: 7.4,
    status: "healthy",
    lastService: "2025-09-18",
  },
  {
    id: "tub-2",
    name: "Guest House Tub",
    temperature: 97,
    ph: 6.9,
    status: "warning",
    lastService: "2025-09-02",
  },
];

const jobs: Job[] = [
  {
    id: "job-1",
    title: "Monthly Cleaning",
    date: "2025-09-20",
    status: "completed",
    notes: "Water balanced and filters replaced",
  },
  {
    id: "job-2",
    title: "Heater Inspection",
    date: "2025-10-02",
    status: "in-progress",
  },
  {
    id: "job-3",
    title: "Deep Drain & Refill",
    date: "2025-10-15",
    status: "scheduled",
  },
];

const StatusBadge = ({ status }: { status: TubStatus }) => {
  const map = {
    healthy: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/20 text-amber-400",
    maintenance: "bg-rose-500/20 text-rose-400",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${map[status]}`}>
      {status}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Main Customer Portal Component
// -----------------------------------------------------------------------------

export default function CustomerPortal() {
  const { currentUser } = useContext(AuthContext);
  // const { upsertMessage, messagesData } = useContextQueries();
  const [draft, setDraft] = useState("");

  const sendMessage = async () => {
    if (!draft.trim()) return;
    // await upsertMessage({
    //   user_to: null,
    //   message_text: draft,
    // });
    setDraft("");
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customer Portal</h1>
            <p className="text-slate-400 text-sm">
              Monitor your tubs, services, and communicate with our team
            </p>
          </div>
        </div>

        {/* Tub Status */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tubs.map((tub) => (
            <motion.div
              key={tub.id}
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">{tub.name}</h2>
                <StatusBadge status={tub.status} />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Thermometer className="text-cyan-400" size={16} />
                  <span>{tub.temperature}°F</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="text-indigo-400" size={16} />
                  <span>pH {tub.ph}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-slate-400" size={16} />
                  <span>{tub.lastService}</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-400">
                Live sensor data updates every 15 minutes
              </div>
            </motion.div>
          ))}
        </section>

        {/* Jobs & History */}
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Service Jobs</h2>
            <Calendar size={18} className="text-slate-400" />
          </div>

          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5"
              >
                <div className="shrink-0">
                  {job.status === "completed" && (
                    <CheckCircle2 className="text-emerald-400" />
                  )}
                  {job.status === "in-progress" && (
                    <Wrench className="text-cyan-400" />
                  )}
                  {job.status === "scheduled" && (
                    <AlertTriangle className="text-amber-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium">{job.title}</div>
                  <div className="text-xs text-slate-400">{job.date}</div>
                  {job.notes && (
                    <div className="text-xs text-slate-300 mt-1">
                      {job.notes}
                    </div>
                  )}
                </div>

                <span className="text-xs capitalize text-slate-400">
                  {job.status.replace("-", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Chat */}
        <MiniChat />
      </div>
    </div>
  );
}
