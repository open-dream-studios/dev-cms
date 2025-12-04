// src/modules/UpdatesModule/UpdatesView.tsx
"use client";
import React, { useContext, useMemo, useState } from "react";
import { useUpdates } from "@/contexts/queryContext/queries/updates";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import UpdateCard from "./UpdateCard";
import { Plus, Check, List, Clock } from "lucide-react";
import { useCurrentTheme } from "@/hooks/useTheme";
import { AuthContext } from "@/contexts/authContext";

/**
 * Layout:
 * - top bar with title + new request button
 * - three columns: Upcoming, Requests, Completed
 * - each column lists cards
 * - there is a right-side drawer/modal for adding new update/request (inline form in UpdateCard handles edit/add)
 */

const UpdatesView: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentProjectId } = useCurrentDataStore();
  const { addingUpdate, setAddingUpdate } = useUiStore();
  const isLoggedIn = !!currentUser;
  const { updatesData = [], isLoadingUpdates } = useUpdates(
    isLoggedIn,
    currentProjectId
  );

  const upcoming = useMemo(
    () =>
      updatesData.filter(
        (u) => u.status === "upcoming" || u.status === "in_progress"
      ),
    [updatesData]
  );
  const requests = useMemo(
    () => updatesData.filter((u) => u.status === "requested"),
    [updatesData]
  );
  const completed = useMemo(
    () => updatesData.filter((u) => u.status === "completed"),
    [updatesData]
  );

  return (
    <div className="w-full h-full px-6 pt-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[22px] font-semibold">Product & App Updates</div>
          <div className="text-[13px] opacity-70 mt-1">
            Track upcoming features, requests, and recent releases
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddingUpdate(!addingUpdate)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium hover:brightness-90 transition"
            style={{
              backgroundColor: currentTheme.app_color_1,
              color: currentTheme.text_1,
            }}
          >
            <Plus size={16} />
            Add Request
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 h-[calc(100%-80px)]">
        {/* New Updates */}
        <section className="min-h-[100px]">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.12)" }}
              aria-hidden
            >
              <Check size={18} />
            </div>
            <div>
              <div className="text-[15px] font-semibold">Recent App Updates</div>
              <div className="text-[13px] opacity-60">
                {completed.length} updates
              </div>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[64vh] pr-2">
            {completed.map((u) => (
              <UpdateCard key={u.id ?? Math.random()} update={u} />
            ))}
            {completed.length === 0 && (
              <div className="text-[13px] opacity-60">
                No new updates
              </div>
            )}
          </div>
        </section>

        {/* Upcoming */}
        <section className="min-h-[100px]">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(6,182,212,0.12)" }}
              aria-hidden
            >
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[15px] font-semibold">Upcoming Features</div>
              <div className="text-[13px] opacity-60">
                {upcoming.length} features
              </div>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[64vh] pr-2">
            {upcoming.map((u) => (
              <UpdateCard key={u.id ?? Math.random()} update={u} />
            ))}
            {upcoming.length === 0 && (
              <div className="text-[13px] opacity-60">No upcoming updates.</div>
            )}
          </div>
        </section>

        {/* Requests */}
        <section className="min-h-[100px]">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.12)" }}
              aria-hidden
            >
              <List size={18} />
            </div>
            <div>
              <div className="text-[15px] font-semibold">Requests</div>
              <div className="text-[13px] opacity-60">
                {requests.length} pending
              </div>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[64vh] pr-2">
            {addingUpdate && <UpdateCard showAsNew />}
            {requests.map((u) => (
              <UpdateCard key={u.id ?? Math.random()} update={u} />
            ))}
            {requests.length === 0 && (
              <div className="text-[13px] opacity-60">No requests</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UpdatesView;
