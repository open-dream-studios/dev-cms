// project/src/components/Dashboard/DashboardPresets.ts
export const DashboardLayout1 = {
  id: "layout-1",
  name: "Example layout: top fixed / middle dynamic / bottom fixed",
  sections: [
    {
      id: "top",
      name: "Top Bar",
      fixedHeight: 80,
      heightRatio: 0,
      layoutHint: { name: "full" },
      shapes: [{ id: "top-shape", moduleId: "layout1_topbar", overflowHidden: false, bg: false }],
    },

    {
      id: "middle",
      name: "Middle",
      heightRatio: 1,
      layoutHint: { name: "left-2/3-right-stacked" },
      shapes: [
        { id: "middle-left", moduleId: "layout1_graph" },
        { id: "middle-right-top", moduleId: "layout1_map", overflowHidden: true },
        { id: "middle-right-bottom", moduleId: "layout1_metrics" },
      ],
    },

    {
      id: "bottom",
      name: "Bottom",
      fixedHeight: 250,
      heightRatio: 0,
      layoutHint: { name: "full" },
      shapes: [{ id: "bottom-shape", moduleId: "layout1_bottom" }],
    },
  ],
};
