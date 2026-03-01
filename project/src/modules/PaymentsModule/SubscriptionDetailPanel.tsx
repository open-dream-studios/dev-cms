// project/src/modules/PaymentsModule/SubscriptionDetailPanel.tsx
import {
  StripeSubscription,
  Customer,
  formatPhoneNumber,
} from "@open-dream/shared";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  CalendarDays,
  Ban,
} from "lucide-react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import {
  formatCustomerName,
  formatUnixDate,
  getStatusTone,
} from "./_helpers/payments.helpers";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { openWindow } from "@/util/functions/Handlers";
import { statusToneStyles } from "./StripeSubscriptions";

const CompactRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-start justify-between gap-4 py-1.5">
    <div className="text-[10.4px] uppercase tracking-[0.12em] text-white/59 shrink-0">
      {label}
    </div>
    <div className="text-[12px] text-white/65 break-all text-right">
      {value || "-"}
    </div>
  </div>
);

const SubscriptionDetailPanel = ({
  subscription,
  customer,
  isMobile,
  onBack,
  onOpenCustomer,
  stripe_account,
}: {
  subscription: StripeSubscription;
  customer: Customer | null;
  isMobile: boolean;
  onBack: () => void;
  onOpenCustomer: () => Promise<void>;
  stripe_account: string | null;
}) => {
  const currentTheme = useCurrentTheme();
  const tone = getStatusTone(subscription.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      style={{ backgroundColor: currentTheme.innerCard }}
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
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">
              Subscription
            </p>
            <h3 className="text-[18px] md:text-[20px] font-[650] truncate">
              {formatCustomerName(subscription)}
            </h3>
          </div>
        </div>
        <div className="flex flex-row gap-[7px] items-center">
          <div
            className={`pl-[10px] pr-[11px] py-1 rounded-full border text-[11px] font-medium ${statusToneStyles[tone]}`}
          >
            {capitalizeFirstLetter(subscription.status.replaceAll("_", " "))}
          </div>
          {stripe_account && subscription.stripe_subscription_id && (
            <div
              onClick={() => {
                openWindow(
                  `${stripe_account}/subscriptions/${subscription.stripe_subscription_id}`,
                );
              }}
              className="flex items-center gap-1.5 px-3 py-[3px] rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[12px] font-medium text-white/80 dim cursor-pointer"
            >
              Edit
              <ExternalLink size={13} className="opacity-70" />
            </div>
          )}
        </div>
      </div>

      <div className="h-[calc(100%-70px)] overflow-auto p-4 md:p-5 space-y-4">
        <button
          onClick={onOpenCustomer}
          disabled={!customer}
          // from-sky-400/18 to-indigo-400/10
          className="w-full text-left rounded-2xl border border-sky-300/25 bg-gradient-to-br from-sky-400/20 to-indigo-400/12 cursor-pointer hover:brightness-85 dim p-4 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">
                Customer
              </p>
              <p className="text-[16px] font-semibold mt-0.5">
                {customer
                  ? `${capitalizeFirstLetter(customer.first_name)} ${capitalizeFirstLetter(customer.last_name)}`
                  : "Customer not found"}
              </p>
              <p className="text-[13px] text-white/70 mt-1">
                {customer?.email ||
                  customer?.phone ||
                  subscription.meta_email ||
                  "No direct contact data"}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
              <ExternalLink size={15} className="opacity-[0.65]" />
            </div>
          </div>
        </button>

        <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-[10px]">
          <div className="space-y-1">
            <CompactRow
              label="Stripe Subscription"
              value={subscription.stripe_subscription_id}
            />
            <CompactRow
              label="Stripe Customer"
              value={subscription.stripe_customer_id}
            />
            <CompactRow label="Price ID" value={subscription.stripe_price_id} />
            <CompactRow
              label="Customer ID"
              value={subscription.customer_id || "-"}
            />
          </div>
        </div>

        {/* <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 mb-3">
            Billing Window
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1 flex items-center gap-2">
                <CalendarClock size={14} /> Current Start
              </div>
              <div>{formatUnixDate(subscription.current_period_start)}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1 flex items-center gap-2">
                <CalendarClock size={14} /> Current End
              </div>
              <div>{formatUnixDate(subscription.current_period_end)}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1">Cancel At Period End</div>
              <div>{subscription.cancel_at_period_end ? "Yes" : "No"}</div>
            </div>
          </div>
        </div> */}

        <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/55 mb-3">
            Billing Window
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-[12px]">
            <div className="flex items-center justify-between md:block">
              <div className="flex items-center gap-1.5 text-white/55 text-[10.4px] uppercase tracking-[0.12em]">
                <CalendarDays size={12} />
                Start
              </div>
              <div className="text-white/85 mt-[4px] md:mt-[5px]">
                {formatUnixDate(subscription.current_period_start)}
              </div>
            </div>

            <div className="flex items-center justify-between md:block">
              <div className="flex items-center gap-1.5 text-white/55 text-[10.4px] uppercase tracking-[0.12em]">
                <CalendarDays size={12} />
                End
              </div>
              <div className="text-white/85 mt-[4px] md:mt-[5px]">
                {formatUnixDate(subscription.current_period_end)}
              </div>
            </div>

            <div className="flex items-center justify-between md:block mt-[-1px]">
              <div className="flex items-center gap-1.5 text-white/55 text-[10.4px] uppercase tracking-[0.12em]">
                <Ban size={12} />
                Set to Cancel
              </div>
              <div className="text-white/85 mt-[4px] md:mt-[5px] opacity-[0.95]">
                {subscription.status === "canceled"
                  ? "-"
                  : subscription.cancel_at_period_end
                    ? "Yes"
                    : "No"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/55 mb-3">
            Submitted Info
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1 flex items-center gap-2">
                <Mail size={14} /> Email
              </div>
              <div>{subscription.meta_email || "-"}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-white/55 mb-1 flex items-center gap-2">
                <Phone size={14} /> Phone
              </div>
              <div>
                {subscription.meta_phone
                  ? formatPhoneNumber(subscription.meta_phone)
                  : "N/A"}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 md:col-span-2">
              <div className="text-white/55 mb-1 flex items-center gap-2">
                <MapPin size={14} /> Address
              </div>
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
