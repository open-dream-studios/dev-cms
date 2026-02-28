// project/src/modules/PaymentsModule/ActiveSubscriptions.tsx
import { ActiveSubscription, Customer } from "@open-dream/shared";
import { motion } from "framer-motion";
import { ExternalLink, CalendarDays, Search } from "lucide-react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { formatCustomerName, formatUnixDate, getStatusTone, getSubscriptionSubtitle } from "./_helpers/payments.helpers";

const toneStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-200 border-emerald-300/30",
  warning: "bg-amber-500/15 text-amber-200 border-amber-300/30",
  danger: "bg-rose-500/15 text-rose-200 border-rose-300/30",
  neutral: "bg-white/10 text-white/75 border-white/20",
};

const ActiveSubscriptions = ({
  subscriptions,
  selectedSubscriptionId,
  customerQuery,
  onChangeQuery,
  onSelect,
  onOpenCustomer,
  findCustomer,
}: {
  subscriptions: ActiveSubscription[];
  selectedSubscriptionId: string | null;
  customerQuery: string;
  onChangeQuery: (v: string) => void;
  onSelect: (stripeSubscriptionId: string) => void;
  onOpenCustomer: (customer: Customer | null) => Promise<void>;
  findCustomer: (customer_id: string | null) => Customer | null;
}) => {
  const currentTheme = useCurrentTheme();

  return (
    <div
      style={{ backgroundColor: currentTheme.background_2 }}
      className="h-full rounded-2xl border border-white/10 overflow-hidden shadow-[0_16px_42px_rgba(0,0,0,0.35)]"
    >
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Stripe</p>
            <h2 className="text-[20px] md:text-[22px] leading-[1.1] font-[650]">Active Subscriptions</h2>
          </div>
          <div className="text-[11px] text-white/55 border border-white/10 rounded-full px-2.5 py-1 bg-white/5">
            {subscriptions.length} total
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={15} />
          <input
            value={customerQuery}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Search by customer, email, subscription id"
            className="w-full h-[38px] rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-[13px] outline-none focus:border-sky-300/45"
          />
        </div>
      </div>

      <div className="h-[calc(100%-128px)] overflow-auto p-3 space-y-2">
        {subscriptions.map((subscription) => {
          const selected = selectedSubscriptionId === subscription.stripe_subscription_id;
          const tone = getStatusTone(subscription.status);
          const customer = findCustomer(subscription.customer_id);

          return (
            <div
              key={subscription.id}
              onClick={() => onSelect(subscription.stripe_subscription_id)}
              style={{
                backgroundColor: selected ? "rgba(99, 179, 237, 0.18)" : "rgba(255,255,255,0.04)",
                borderColor: selected ? "rgba(125, 211, 252, 0.5)" : "rgba(255,255,255,0.08)",
              }}
              className="w-full text-left rounded-2xl border px-3.5 py-3.5 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[16px] font-[620] truncate">{formatCustomerName(subscription)}</div>
                  <div className="text-[12.5px] text-white/63 mt-0.5 truncate">{getSubscriptionSubtitle(subscription)}</div>
                </div>
                <div className={`shrink-0 px-2 py-1 rounded-full border text-[11px] ${toneStyles[tone]}`}>
                  {subscription.status}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-white/12 bg-white/6 px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">Next Renewal</div>
                  <div className="mt-1 text-[12.5px] flex items-center gap-1.5 text-white/88">
                    <CalendarDays size={13} /> {formatUnixDate(subscription.current_period_end)}
                  </div>
                </div>

                <div className="rounded-xl border border-white/12 bg-gradient-to-br from-cyan-400/20 to-sky-500/10 px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">Credits 1</div>
                  <div className="mt-1 text-[14px] font-[630]">1.5</div>
                </div>

                <div className="rounded-xl border border-white/12 bg-gradient-to-br from-indigo-400/20 to-purple-500/10 px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">Credits 2</div>
                  <div className="mt-1 text-[14px] font-[630]">3</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-[11px] text-white/50 truncate">{subscription.stripe_subscription_id}</div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!customer) return;
                    onOpenCustomer(customer);
                  }}
                  // disabled={!customer}
                  className="shrink-0 text-[12px] px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/6 hover:bg-white/12 dim disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  Customer
                  <ExternalLink size={13} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveSubscriptions;
