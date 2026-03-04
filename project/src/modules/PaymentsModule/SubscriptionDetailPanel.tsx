// project/src/modules/PaymentsModule/SubscriptionDetailPanel.tsx
import {
  StripeSubscription,
  Customer,
  formatPhoneNumber,
  appDetailsProjectByDomain,
  LedgerCreditType,
  stripeProductsByPriceId,
  SubscriptionTier,
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
  Plus,
  Minus,
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
import { useUiStore } from "@/store/useUIStore";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCreditBalanceAdjustments } from "@/contexts/queryContext/queries/payments/credits";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "react-toastify";

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

const formatCreditBalance = (
  value: number | string | null | undefined,
): string => {
  if (value == null) return "-";
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(numericValue)) return "-";
  return numericValue.toFixed(2);
};

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
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { domain, modal2, setModal2 } = useUiStore();
  const currentTheme = useCurrentTheme();
  const foundProject = appDetailsProjectByDomain(domain);

  const { creditBalances, adjustCredit } = useCreditBalanceAdjustments(
    !!currentUser,
    currentProjectId,
    customer?.customer_id ?? null,
    subscription.stripe_customer_id,
    subscription.stripe_subscription_id,
  );

  const tone = getStatusTone(subscription.status);
  const isActiveLike = ["active", "trialing", "past_due"].includes(
    subscription.status,
  );
  const isPaused = subscription.status === "paused";
  const isUnpaid = subscription.status === "unpaid";

  let endLabel = "Ended";
  let endValue = subscription.subscription_end
    ? formatUnixDate(subscription.subscription_end)
    : "-";

  if (isActiveLike) {
    endLabel = subscription.cancel_at_period_end ? "Ends" : "Renews";
    endValue = formatUnixDate(subscription.current_period_end);
  } else if (isPaused) {
    endLabel = "Paused";
  } else if (isUnpaid) {
    if (subscription.subscription_end) {
      endLabel = "Ended";
      endValue = formatUnixDate(subscription.subscription_end);
    } else {
      endLabel = "Unpaid Cycle End";
      endValue = formatUnixDate(subscription.current_period_end);
    }
  }

  // Verify credit deduction is not more than current balance
  const onCreditAdjustment = (
    adjustment: "+" | "-",
    creditType: LedgerCreditType,
  ) => {
    if (!subscription.customer_id) return;
    if (!creditBalances) return;

    const steps: StepConfig[] = [
      {
        name: "amount",
        placeholder: `(${adjustment}) Credits`,
        sanitize: (value: string) => {
          // remove everything except digits and dots
          let cleaned = value.replace(/[^\d.]/g, "");

          // allow only one dot
          const firstDotIndex = cleaned.indexOf(".");
          if (firstDotIndex !== -1) {
            const beforeDot = cleaned.slice(0, firstDotIndex);
            let afterDot = cleaned.slice(firstDotIndex + 1).replace(/\./g, "");

            // limit to 2 decimal places
            afterDot = afterDot.slice(0, 2);
            cleaned = beforeDot + "." + afterDot;
          }

          // prevent leading dot
          if (cleaned.startsWith(".")) {
            cleaned = "0" + cleaned;
          }

          return cleaned;
        },
      },
    ];

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          steps={steps}
          key={`trigger-${Date.now()}`}
          onComplete={async (values) => {
            const amount = Number(values.amount);
            if (isNaN(amount) || amount <= 0) {
              toast.warn("Invalid amount");
              return;
            }

            // determine current balance for this credit type
            const currentBalance =
              creditType === 1
                ? creditBalances.credit1_balance
                : creditBalances.credit2_balance;

            // if subtracting, ensure balance is sufficient
            if (adjustment === "-") {
              if (currentBalance == null) {
                toast.warn("Credit is not available");
                return;
              }
              if (currentBalance < amount) {
                toast.warn("Credit deduction is larger than current credit");
                return;
              }
            }

            const amount_delta = adjustment === "+" ? amount : -amount;
            await adjustCredit(creditType, amount_delta);
          }}
        />
      ),
    });
  };

  const foundProduct =
    stripeProductsByPriceId[subscription.stripe_price_id] ?? null;
  let foundTier: string | null = null;
  if (foundProject && foundProduct) {
    const level = foundProduct.level as SubscriptionTier;
    foundTier = foundProject.subscription_tiers[level] ?? null;
  }

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

      <div className="h-[calc(100%-70px)] overflow-auto px-3 pb-3 pt-[11px] md:px-4 md:pb-4 space-y-3">
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

        <div className="flex flex-col gap-[8px] rounded-xl border border-white/12 pl-3 pr-[13px] py-2 bg-white/5">
          <div className="flex flex-row justify-between items-center">
            <div className="text-[11px] uppercase tracking-[0.12em] text-white/60">
              {foundProject && foundProject.credit1_name
                ? `${foundProject.credit1_name}s`
                : "Credits 1"}
            </div>
            <div className="flex flex-row gap-[7px] items-center">
              <div className="opacity-[0.75] mr-[2px] text-[14px] font-[630]">
                {formatCreditBalance(creditBalances?.credit1_balance)}
              </div>
              <div
                onClick={() => onCreditAdjustment("+", 1)}
                className="hover:brightness-75 dim cursor-pointer opacity-[0.6] w-[15px] h-[15px] rounded-full border-[1px] border-white/70 flex items-center justify-center"
              >
                <Plus size={11} />
              </div>
              <div
                onClick={() => onCreditAdjustment("-", 1)}
                className="hover:brightness-75 dim cursor-pointer opacity-[0.6] w-[15px] h-[15px] rounded-full border-[1px] border-white/70 flex items-center justify-center"
              >
                <Minus size={11} />
              </div>
            </div>
          </div>

          <div className="flex flex-row justify-between items-center">
            <div className="text-[11px] uppercase tracking-[0.12em] text-white/60">
              {foundProject && foundProject.credit2_name
                ? `${foundProject.credit2_name}s`
                : "Credits 2"}
            </div>
            <div className="flex flex-row gap-[7px] items-center">
              <div className="opacity-[0.75] mr-[2px] text-[14px] font-[630]">
                {formatCreditBalance(creditBalances?.credit2_balance)}
              </div>
              <div
                onClick={() => onCreditAdjustment("+", 2)}
                className="hover:brightness-75 dim cursor-pointer opacity-[0.6] w-[15px] h-[15px] rounded-full border-[1px] border-white/70 flex items-center justify-center"
              >
                <Plus size={11} />
              </div>
              <div
                onClick={() => onCreditAdjustment("-", 2)}
                className="hover:brightness-75 dim cursor-pointer opacity-[0.6] w-[15px] h-[15px] rounded-full border-[1px] border-white/70 flex items-center justify-center"
              >
                <Minus size={11} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-[8px]">
          <div className="space-y-1">
            <div className="py-1.5">
              <div className="w-[100%] flex justify-between items-center mb-[8px]">
                <p className="text-[12px] uppercase tracking-[0.12em] text-white/55">
                  Subscription
                </p>
                {foundProduct && foundTier && (
                  <p className="text-[12px] uppercase tracking-[0.12em] text-white/55">
                    {`${capitalizeFirstLetter(foundTier)} | ${foundProduct.timeline}`}
                  </p>
                )}
              </div>

              <div className="w-[100%] h-[1px] rounded-full bg-white/8 mb-[12px]"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-[13px]">
                <div className="flex items-center justify-between md:block">
                  <div className="flex items-center gap-1.5 text-white/55 text-[10.4px] uppercase tracking-[0.12em]">
                    <CalendarDays size={12} />
                    Started
                  </div>
                  <div className="text-white/80 mt-[4px] md:mt-[5px]">
                    {formatUnixDate(subscription.subscription_start)}
                  </div>
                </div>

                <div className="flex items-center justify-between md:block">
                  <div className="flex items-center gap-1.5 text-white/55 text-[10.4px] uppercase tracking-[0.12em]">
                    <CalendarDays size={12} />
                    {endLabel}
                  </div>
                  <div className="text-white/80 mt-[4px] md:mt-[5px]">
                    {endValue}
                  </div>
                </div>

                <div className="flex items-center justify-between md:block mt-[-1px]">
                  <div className="flex items-center gap-1.5 text-white/55 text-[10.4px] uppercase tracking-[0.12em]">
                    <Ban size={12} />
                    Set to Cancel
                  </div>
                  <div className="text-white/80 mt-[4px] md:mt-[5px] opacity-[0.95]">
                    {subscription.status === "canceled"
                      ? "-"
                      : subscription.cancel_at_period_end
                        ? "Yes"
                        : "No"}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-[100%] h-[1px] rounded-full bg-white/8 mb-[8px] mt-[7px]"></div>

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

        <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5">
          <p className="text-[12px] uppercase tracking-[0.12em] text-white/55 mb-[10px]">
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
                  : "-"}
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
