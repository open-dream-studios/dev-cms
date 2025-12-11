// project/src/modules/TimelineModule/components/InteractionList.tsx

import React from "react";
import { InteractionItem } from "./types";
import { InteractionEmailCard } from "./InteractionEmailCard";
import { InteractionCallCard } from "./InteractionCallCard";

export function InteractionList({ interactions }: { interactions: InteractionItem[] }) {
  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-2">
      {interactions.map((item) =>
        item.type === "email" ? (
          <InteractionEmailCard key={item.id} item={item} />
        ) : (
          <InteractionCallCard key={item.id} item={item} />
        )
      )}
    </div>
  );
}