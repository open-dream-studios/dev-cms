// project/src/modules/PaymentsModule/PaymentsModule.tsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useRouting } from "@/hooks/useRouting";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { Loader2, RefreshCcw } from "lucide-react";
import SubscriptionDetailPanel from "./SubscriptionDetailPanel";
import {
  getSelectedSubscription,
  usePaymentsStore,
} from "./_store/payments.store";
import { openCustomerFromPayments } from "./_actions/payments.actions";
import { openWindow } from "@/util/functions/Handlers";
import { appDetailsProjectByDomain, normalizeDomain } from "@open-dream/shared";
import { formatTimeDate } from "@/util/functions/Time";
import { useStripeSubscriptions } from "@/contexts/queryContext/queries/payments/subscriptions";
import StripeSubscriptions from "./StripeSubscriptions";

const PaymentsModule = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentProjectId, currentProject } = useCurrentDataStore();
  const { customers } = useContextQueries();
  const { screenClick } = useRouting();

  const {
    selectedSubscriptionId,
    mobileDetailOpen,
    customerQuery,
    setSelectedSubscriptionId,
    setMobileDetailOpen,
    setCustomerQuery,
  } = usePaymentsStore();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const {
    stripeSubscriptions: subscriptions,
    isLoadingStripeSubscriptions,
    syncStripeSubscriptions,
    isSyncingStripeSubscriptions,
  } = useStripeSubscriptions(!!currentUser, currentProjectId);

  useEffect(() => {
    if (!subscriptions.length) return;
    if (selectedSubscriptionId) return;
    const activeSubs = subscriptions.filter((sub) => sub.status === "active");
    if (!activeSubs.length) return;
    setSelectedSubscriptionId(activeSubs[0].stripe_subscription_id);
  }, [subscriptions, selectedSubscriptionId, setSelectedSubscriptionId]);

  const normalizedQuery = customerQuery.trim().toLowerCase();

  const filteredSubscriptions = useMemo(() => {
    if (!normalizedQuery) return subscriptions;
    return subscriptions.filter((subscription) => {
      const values = [
        subscription.stripe_subscription_id,
        subscription.stripe_customer_id,
        subscription.customer_id,
        subscription.meta_email,
        subscription.meta_phone,
        subscription.meta_first_name,
        subscription.meta_last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return values.includes(normalizedQuery);
    });
  }, [subscriptions, normalizedQuery]);

  const selectedSubscription = getSelectedSubscription(
    filteredSubscriptions.length ? filteredSubscriptions : subscriptions,
    selectedSubscriptionId,
  );

  const findCustomer = (customer_id: string | null) => {
    if (!customer_id) return null;
    return customers.find((c) => c.customer_id === customer_id) || null;
  };

  const selectedCustomer = selectedSubscription
    ? findCustomer(selectedSubscription.customer_id)
    : null;

  const openSelectedCustomer = async () => {
    await openCustomerFromPayments(selectedCustomer, screenClick);
  };

  const handleSelectSubscription = (stripeSubscriptionId: string) => {
    setSelectedSubscriptionId(stripeSubscriptionId);
    if (isMobile) setMobileDetailOpen(true);
  };

  const foundProject =
    currentProject && currentProject.backend_domain
      ? appDetailsProjectByDomain(
          normalizeDomain(currentProject.backend_domain),
        )
      : null;

  const stripe_account =
    foundProject && foundProject.stripe_account
      ? `https://dashboard.stripe.com/${foundProject.stripe_account}`
      : null;
  const stripe_url = stripe_account || "https://stripe.com";

  if (!currentUser || !currentProjectId || !currentProject) return null;

  return (
    <div
      style={{ backgroundColor: currentTheme.background_1 }}
      className="relative w-full h-full min-h-[760px] rounded-[18px] px-[14px] py-[12px]"
    >
      <div className="h-full flex flex-col gap-3">
        <div
          style={{ backgroundColor: currentTheme.innerCard }}
          className="h-[62px] min-h-[62px] rounded-2xl border border-white/10 px-4 md:px-5 flex items-center justify-between gap-3"
        >
          <div
            onClick={() => openWindow(stripe_url)}
            className="group flex items-center gap-3 cursor-pointer hover:brightness-82 dim"
          >
            <img
              src="https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/stripe.svg.png"
              alt="Stripe"
              className="h-[22px] w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            {currentProject.last_stripe_update && (
              <div className="text-[11.5px] flex items-center gap-1.5 text-white/43 mr-[5px]">
                {`Last Synced ${formatTimeDate(currentProject.last_stripe_update)}`}
              </div>
            )}
            <button
              onClick={async () => {
                // await syncSubscriptions(testMode);
                await syncStripeSubscriptions();
                // await refetchStripeSubscriptions();
              }}
              disabled={isSyncingStripeSubscriptions}
              className="cursor-pointer hover:brightness-82 dim h-9 px-3 rounded-lg border border-white/15 bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed dim text-[13px] font-medium flex items-center gap-2"
            >
              {isSyncingStripeSubscriptions ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCcw size={14} />
              )}
              Sync
            </button>
            {/* <button
              onClick={async () => {
                await clearSubscriptions();
                setSelectedSubscriptionId(null);
              }}
              disabled={isSyncing || isClearing}
              className="cursor-pointer hover:brightness-82 dim h-9 px-3 rounded-lg border border-rose-300/30 bg-rose-400/20 disabled:opacity-50 disabled:cursor-not-allowed dim text-[13px] font-medium flex items-center gap-2"
            >
              {isClearing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Clear
            </button> */}
            {/* <label className="ml-1 text-[12px] text-white/70 flex items-center gap-2 px-2 py-1 rounded-lg border border-white/15 bg-white/5">
              <input
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
                className="accent-cyan-400"
              />
              Test Mode
            </label> */}
          </div>
        </div>

        <div className="h-[100%] overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-3">
          {(!isMobile || !mobileDetailOpen) && (
            <div className="h-full overflow-auto">
              <StripeSubscriptions
                subscriptions={filteredSubscriptions}
                selectedSubscriptionId={selectedSubscriptionId}
                customerQuery={customerQuery}
                onChangeQuery={setCustomerQuery}
                onSelect={handleSelectSubscription}
                findCustomer={findCustomer}
                onOpenCustomer={async (customer) =>
                  openCustomerFromPayments(customer, screenClick)
                }
              />
            </div>
          )}

          {!isMobile && (
            <div className="h-full overflow-auto">
              {selectedSubscription ? (
                <SubscriptionDetailPanel
                  subscription={selectedSubscription}
                  customer={selectedCustomer}
                  isMobile={false}
                  onBack={() => {}}
                  onOpenCustomer={openSelectedCustomer}
                  stripe_account={stripe_account}
                />
              ) : (
                <div
                  style={{ backgroundColor: currentTheme.background_2 }}
                  className="h-full rounded-2xl border border-white/10 flex items-center justify-center text-white/50"
                >
                  Select a subscription to view full details.
                </div>
              )}
            </div>
          )}

          {isMobile && mobileDetailOpen && selectedSubscription && (
            <div className="h-full overflow-auto">
              <SubscriptionDetailPanel
                subscription={selectedSubscription}
                customer={selectedCustomer}
                isMobile={true}
                onBack={() => setMobileDetailOpen(false)}
                onOpenCustomer={openSelectedCustomer}
                stripe_account={stripe_account}
              />
            </div>
          )}
        </div>

        {isLoadingStripeSubscriptions && (
          <div className="absolute inset-0 bg-black/15 pointer-events-none flex items-center justify-center">
            <div className="px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-[13px] flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Loading subscriptions...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsModule;
