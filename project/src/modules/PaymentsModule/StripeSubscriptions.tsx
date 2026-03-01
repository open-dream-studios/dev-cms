// project/src/modules/PaymentsModule/StripeSubscription.tsx
import {
  StripeSubscription,
  Customer,
  appDetailsProjectByDomain,
  StripeSubscriptionStatus,
} from "@open-dream/shared";
import {
  AlertTriangle,
  ChevronDown,
  PauseCircle,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  formatCustomerName,
  formatUnixDate,
  getStatusTone,
  getSubscriptionEmail,
} from "./_helpers/payments.helpers";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useUiStore } from "@/store/useUIStore";
import {
  StripeSubscriptionStatusFilter,
  usePaymentsStore,
} from "./_store/payments.store";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useAllCreditBalances } from "@/contexts/queryContext/queries/payments/credits";

export const statusToneStyles: Record<string, string> = {
  active: "bg-[#2be06e]/65 text-white border-[#65ff9d]/50",

  warning: "bg-[#C58A18]/70 text-white border-[#F59E0B]/50",

  danger: "bg-[#ff6060]/70 text-white border-[#f07272]/50",

  neutral: "bg-[#3F4650]/70 text-white border-[#6B7280]/50",
};

const StripeSubscriptions = ({
  subscriptions,
  selectedSubscriptionId,
  customerQuery,
  onChangeQuery,
  onSelect,
  onOpenCustomer,
  findCustomer,
}: {
  subscriptions: StripeSubscription[];
  selectedSubscriptionId: string | null;
  customerQuery: string;
  onChangeQuery: (v: string) => void;
  onSelect: (stripeSubscriptionId: string) => void;
  onOpenCustomer: (customer: Customer | null) => Promise<void>;
  findCustomer: (customer_id: string | null) => Customer | null;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { domain } = useUiStore();
  const currentTheme = useCurrentTheme();
  const foundProject = appDetailsProjectByDomain(domain);
  const { subscriptionsFilter, setSubscriptionsFilter } = usePaymentsStore();

  const subscriptionStatusOptions: (StripeSubscriptionStatus | "all")[] = [
    "all",
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "paused",
  ];

  const stripeCustomerIds: string[] = subscriptions.map(
    (sub) => sub.stripe_customer_id,
  );
  const { allCreditBalances } = useAllCreditBalances(
    !!currentUser,
    currentProjectId,
    stripeCustomerIds,
  ); 

  return (
    <div
      style={{ backgroundColor: currentTheme.innerCard }}
      className="h-full rounded-2xl border border-white/10 overflow-hidden shadow-[0_16px_42px_rgba(0,0,0,0.35)]"
    >
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">
              Stripe
            </p>
            <h2 className="text-[20px] md:text-[22px] leading-[1.1] font-[650]">
              Subscriptions
            </h2>
          </div>
          <div className="flex flex-row gap-[6px] items-center">
            <div className="flex flex-row gap-[6px] items-center">
              <div className="relative min-w-[120px]">
                <select
                  value={subscriptionsFilter}
                  onChange={(e) =>
                    setSubscriptionsFilter(
                      e.target.value as StripeSubscriptionStatusFilter,
                    )
                  }
                  className="w-full appearance-none outline-none text-[11px] text-white/90 border border-white/10 rounded-full pl-2.5 pr-7 py-1 bg-white/5 hover:brightness-80 dim cursor-pointer"
                >
                  {subscriptionStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {capitalizeFirstLetter(status.replaceAll("_", " "))}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 mt-[1px] text-white/72 text-[10px]">
                  <ChevronDown size={13} />
                </div>
              </div>

              <div className="text-[11px] text-white/90 border border-white/10 rounded-full pl-[10px] pr-[12.5px] py-1 bg-white/5">
                {subscriptions.length} total
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
            size={15}
          />
          <input
            value={customerQuery}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Search by customer, email, subscription id"
            className="w-full h-[38px] rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-[13px] outline-none focus:border-sky-300/45"
          />
        </div>
      </div>

      <div className="h-[calc(100%-128px)] overflow-auto p-3 space-y-2">
        {subscriptions
          .filter(
            (subscription) =>
              subscriptionsFilter === "all" ||
              subscription.status === subscriptionsFilter,
          )
          .map((subscription) => {
            const selected =
              selectedSubscriptionId === subscription.stripe_subscription_id;
            const tone = getStatusTone(subscription.status);
            const customer = findCustomer(subscription.customer_id);
            const isActiveLike = ["active", "trialing", "past_due"].includes(
              subscription.status,
            );
            const isPaused = subscription.status === "paused";
            const isUnpaid = subscription.status === "unpaid";

            let timelineIcon = (
              <X size={13} className="opacity-85 mt-[-1px] mr-[-1px]" />
            );
            let timelineDate = subscription.subscription_end
              ? formatUnixDate(subscription.subscription_end)
              : "-";

            if (isActiveLike && !subscription.cancel_at_period_end) {
              timelineIcon = <RotateCw size={12} className="opacity-85" />;
              timelineDate = formatUnixDate(subscription.current_period_end);
            } else if (isActiveLike && subscription.cancel_at_period_end) {
              timelineDate = formatUnixDate(subscription.current_period_end);
            } else if (isPaused) {
              timelineIcon = <PauseCircle size={13} className="opacity-85" />;
            } else if (isUnpaid) {
              timelineIcon = <AlertTriangle size={13} className="opacity-85" />;
              timelineDate = subscription.subscription_end
                ? formatUnixDate(subscription.subscription_end)
                : formatUnixDate(subscription.current_period_end);
            }

            return (
              <div
                key={subscription.id}
                onClick={() => onSelect(subscription.stripe_subscription_id)}
                style={{
                  backgroundColor: selected
                    ? "rgba(99, 179, 237, 0.18)"
                    : "rgba(255,255,255,0.04)",
                  borderColor: selected
                    ? "rgba(125, 211, 252, 0.5)"
                    : "rgba(255,255,255,0.08)",
                }}
                className="cursor-pointer hover:brightness-90 dim w-full text-left rounded-2xl border px-3.5 pb-2.5 pt-[9px] transition-all duration-150 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="mt-[1px] min-w-0 cursor-pointer hover:brightness-74 dim"
                    onClick={(e) => {
                      if (!customer) return;
                      onOpenCustomer(customer);
                    }}
                  >
                    <div className="text-[16px] font-[620] truncate">
                      {formatCustomerName(subscription)}
                    </div>
                    <div className="text-[12.5px] text-white/55 mt-0.5 truncate">
                      {getSubscriptionEmail(subscription)}
                    </div>
                  </div>
                  <div className="flex flex-col mt-[1.5px]">
                    <div
                      className={`self-end min-w-0 pl-[12px] pr-[13px] py-[2px] rounded-full border ${statusToneStyles[tone]}`}
                    >
                      <p className="text-[11px]">
                        {capitalizeFirstLetter(
                          subscription.status.replaceAll("_", " "),
                        )}
                      </p>
                    </div>

                    <div className="mt-1 text-[11.5px] flex items-center gap-1.5 text-white/55">
                      {timelineIcon} {timelineDate}
                    </div>
                  </div>
                </div>

                <div className="mt-[6px] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* <div className="rounded-xl border border-white/12 bg-white/6 px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">
                    Next Renewal
                  </div>
                  <div className="mt-1 text-[12.5px] flex items-center gap-1.5 text-white/88">
                    <CalendarDays size={13} />{" "}
                    {formatUnixDate(subscription.current_period_end)}
                  </div>
                </div> */}

                  <div
                    // bg-gradient-to-br from-cyan-400/20 to-sky-500/10
                    className="flex flex-row justify-between items-center rounded-lg border border-white/12 px-2.5 py-1 bg-white/5"
                  >
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">
                      {foundProject && foundProject.credit1_name
                        ? `${foundProject.credit1_name}s`
                        : "Credits 1"}
                    </div>
                    <div className="opacity-[0.75] text-[14px] font-[630]">
                      {Object.keys(allCreditBalances).includes(
                        subscription.stripe_customer_id,
                      ) &&
                      allCreditBalances[subscription.stripe_customer_id] &&
                      allCreditBalances[subscription.stripe_customer_id]
                        .credit1_balance != null
                        ? allCreditBalances[subscription.stripe_customer_id]
                            .credit1_balance
                        : "N/A"}
                    </div>
                  </div>

                  <div
                    // bg-gradient-to-br from-indigo-400/20 to-purple-500/10
                    className="flex flex-row justify-between items-center rounded-lg border border-white/12 px-2.5 py-1 bg-white/5"
                  >
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/60">
                      {foundProject && foundProject.credit2_name
                        ? `${foundProject.credit2_name}s`
                        : "Credits 2"}
                    </div>
                    <div className="opacity-[0.75] text-[14px] font-[630]">
                      {Object.keys(allCreditBalances).includes(
                        subscription.stripe_customer_id,
                      ) &&
                      allCreditBalances[subscription.stripe_customer_id] &&
                      allCreditBalances[subscription.stripe_customer_id]
                        .credit2_balance != null
                        ? allCreditBalances[subscription.stripe_customer_id]
                            .credit2_balance
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default StripeSubscriptions;
