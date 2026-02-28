// project/src/modules/PaymentsModule/SubscriptionDetailPanel.tsx
import { ActiveSubscription, Customer } from "@open-dream/shared";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, MapPin, CalendarClock, Mail, Phone } from "lucide-react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { formatCustomerName, formatUnixDate, getStatusTone } from "./_helpers/payments.helpers";

const toneStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-200 border-emerald-300/30",
  warning: "bg-amber-500/15 text-amber-200 border-amber-300/30",
  danger: "bg-rose-500/15 text-rose-200 border-rose-300/30",
  neutral: "bg-white/10 text-white/75 border-white/20",
};

const InfoCell = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1 rounded-xl bg-white/5 border border-white/10 p-3">
    <div className="text-[11px] uppercase tracking-[0.12em] text-white/45">{label}</div>
    <div className="text-[13px] md:text-[14px] text-white/90 break-all">{value || "-"}</div>
  </div>
);

const SubscriptionDetailPanel = ({
  subscription,
  customer,
  isMobile,
  onBack,
  onOpenCustomer,
}: {
  subscription: ActiveSubscription;
  customer: Customer | null;
  isMobile: boolean;
  onBack: () => void;
  onOpenCustomer: () => Promise<void>;
}) => {
  const currentTheme = useCurrentTheme();
  const tone = getStatusTone(subscription.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      style={{ backgroundColor: currentTheme.background_2 }}
      className="h-full rounded-2xl border border-white/10 overflow-hidden shadow-[0_16px_42px_rgba(0,0,0,0.35)]"
    >
      <div className="px-4 md:px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <button
              onClick={onBack}
              className="h-9 w-9 rounded-lg bg-white/8 hover:bg-white/14 dim cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Subscription</p>
            <h3 className="text-[18px] md:text-[20px] font-[650] truncate">{formatCustomerName(subscription)}</h3>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full border text-[11px] font-medium ${toneStyles[tone]}`}>
          {subscription.status || "unknown"}
        </div>
      </div>

      <div className="h-[calc(100%-70px)] overflow-auto p-4 md:p-5 space-y-4">
        <button
          onClick={onOpenCustomer}
          disabled={!customer}
          className="w-full text-left rounded-2xl border border-sky-300/25 bg-gradient-to-br from-sky-400/18 to-indigo-400/10 hover:from-sky-400/24 hover:to-indigo-400/14 dim p-4 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Customer</p>
              <p className="text-[16px] font-semibold mt-0.5">{customer ? `${customer.first_name} ${customer.last_name}` : "Customer not found"}</p>
              <p className="text-[13px] text-white/70 mt-1">
                {customer?.email || customer?.phone || subscription.meta_email || "No direct contact data"}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
              <ExternalLink size={15} />
            </div>
          </div>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCell label="Stripe Subscription" value={subscription.stripe_subscription_id} />
          <InfoCell label="Stripe Customer" value={subscription.stripe_customer_id} />
          <InfoCell label="Price ID" value={subscription.stripe_price_id} />
          <InfoCell label="Customer ID" value={subscription.customer_id || "-"} />
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 mb-3">Billing Window</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1 flex items-center gap-2"><CalendarClock size={14} /> Current Start</div>
              <div>{formatUnixDate(subscription.current_period_start)}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1 flex items-center gap-2"><CalendarClock size={14} /> Current End</div>
              <div>{formatUnixDate(subscription.current_period_end)}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1">Cancel At Period End</div>
              <div>{subscription.cancel_at_period_end ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 mb-3">Meta Contact</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1 flex items-center gap-2"><Mail size={14} /> Email</div>
              <div>{subscription.meta_email || "-"}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1 flex items-center gap-2"><Phone size={14} /> Phone</div>
              <div>{subscription.meta_phone || "-"}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 md:col-span-2">
              <div className="text-white/55 mb-1 flex items-center gap-2"><MapPin size={14} /> Address</div>
              <div>
                {[
                  subscription.meta_address_line1,
                  subscription.meta_address_line2,
                  subscription.meta_city,
                  subscription.meta_state,
                  subscription.meta_zip,
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionDetailPanel;
