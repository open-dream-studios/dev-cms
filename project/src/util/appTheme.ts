// project/src/util/theme.ts
export type ThemeType = "light" | "dark";

const c = (light: string, dark: string) => [light, dark] as const;
export const makeTheme = (isDark: boolean) =>
  Object.freeze(
    Object.fromEntries(
      Object.entries(themeColors).map(([key, [light, dark]]) => [
        key,
        isDark ? dark : light,
      ])
    )
  );

const themeColors = {
  background_stark: c("#FFFFFF", "#131313"),
  background_1: c("#FFFFFF", "#161616"),
  background_2: c("#E9E9E9", "#282828"),
  background_3: c("#BBBBBB", "#333333"),
  background_3_2: c("#AAAAAA", "#494949"),
  background_4: c("#AAAAAA", "#666666"),
  background_1_2: c("#EFEFEF", "#252525"),
  background_1_2Mix: c("#FFFFFF", "#252525"),
  background_2_dim: c("#F0F0F0", "#1e1e1e"),
  background_2_selected: c("#D9D9D9", "#343434"),
  background_2_2: c("#E0E0E0", "#343434"),

  component_bg_1: c("#f5f5f5", "#161616"),
  bot_message: c("#DDDDDD", "#222222"),
  user_message: c("#DDDDDD", "#222222"),
  bot_time_stamp: c("#CCCCCC", "#393939"),

  // Components
  header_1_1: c("#E9E9E9", "#252525"),
  header_1_2: c("#CCCCCC", "#333333"),

  // Cards
  card_bg_1: c("#E6E6E6", "#1D1D1D"),

  // Texts
  text_1: c("#000000", "#FFFFFF"),
  text_2: c("#1F1F1F", "#DDDDDD"),
  text_3: c("#555555", "#BBBBBB"),
  text_4: c("#999999", "#888888"),

  flash_cards: c("#FAFAFA", "#888888"),

  // Tables
  table_bg_1: c("#FFFFFF", "#161616"),
  table_bg_2: c("#E9E9E9", "#252525"),

  // Globals
  app_color_1: c("#5CABD9", "#5CABD9"),
  app_color_2: c("#366A7F", "#366A7F"),
  app_color_3: c("#318CBF", "#318CBF"),
  app_text_color_1: c("#5CABD9", "#5CABD9"),

  // Delete
  delete: c("#cf2d27", "#cf2d27"),

  // PRIORITY COLORS
  priority_urgent: c("#B30000", "#ef4444"),
  priority_high: c("#AD7E11", "#f59e0b"),

  // STATUS COLORS
  status_waiting_diagnosis: c("#0B8499", "#06b6d4"),
  status_waiting_work: c("#477DBF", "#60a5fa"),
  status_waiting_parts: c("#AD7E11", "#f59e0b"),
  status_waiting_customer: c("#AD7E11", "#f59e0b"),
  status_waiting_listing: c("#8b5cf6", "#8b5cf6"),
  status_listed: c("#8b5cf6", "#8b5cf6"),
  status_waiting_delivery: c("#477DBF", "#60a5fa"),
  status_complete: c("#1E9649", "#16a34a"),
  status_cancelled: c("#E01010", "#ef4444"),
} as const;

export const appTextSizes = {
  textHead1:
    "text-[16px] sm:text-[18px] md:text-[19px] lg:text-[21px] leading-[23px] sm:leading-[25px] md:leading-[26px] lg:leading-[28px]",
  textHead3:
    "text-[14px] sm:text-[16px] md:text-[17px] lg:text-[19px] leading-[21px] sm:leading-[23px] md:leading-[24px] lg:leading-[26px]",
  textHead5:
    "text-[14px] sm:text-[14px] md:text-[15px] lg:text-[17px] leading-[19px] sm:leading-[21px] md:leading-[22px] lg:leading-[24px]",
  textSub1:
    "text-[11px] sm:text-[11px] md:text-[12px] lg:text-[13px] leading-[11px] sm:leading-[11px] md:leading-[12px] lg:leading-[13px]",
};
