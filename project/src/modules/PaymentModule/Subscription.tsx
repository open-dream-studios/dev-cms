// project/src/modules/PaymentModule/Subscription.tsx
"use client";
import { useContext } from "react";
import StripeProvider from "./Stripe/StripeProvider";
import { AuthContext } from "../../contexts/authContext";
import Modal2Close from "../../modals/Modal2Close";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import Modal2Continue from "@/modals/Modal2Continue";
import { useUiStore } from "@/store/useUIStore";
import { makeRequest } from "@/util/axios";
import {
  CreditType,
  stripeProducts,
  SubscriptionType,
} from "@open-dream/shared"; 

const Subscription = () => {
  const currentTheme = useCurrentTheme();
  const { currentUser, currentUserSubscription } = useContext(AuthContext);
  const { modal2, setModal2 } = useUiStore();

  const handleCheckout = async (product: CreditType | SubscriptionType) => {
    if (!currentUser) return;
    if (currentUserSubscription) {
      setModal2({
        ...modal2,
        open: !modal2.open,
        showClose: false,
        offClickClose: true,
        width: "w-[400px]",
        maxWidth: "max-w-[400px]",
        aspectRatio: "aspect-[5/2]",
        borderRadius: "rounded-[12px] md:rounded-[15px]",
        content: <Modal2Close text={"You are already subscribed!"} />,
      });
      return;
    }
    const res = await makeRequest.post(`/payment/checkout-session`, {
      product_type: product,
    });
    const { url } = res.data;
    if (url) {
      window.location.href = url;
    }
  };

  const handleChangeSubscription = async (product: SubscriptionType) => {
    if (!currentUser || !currentUserSubscription) return;

    const current_timeline =
      currentUserSubscription.subscription_item.split("_L")[0];
    const current_level = parseInt(
      currentUserSubscription.subscription_item.split("_L")[1],
    );
    const incoming_timeline = product.split("_L")[0];
    const incoming_level = parseInt(product.split("_L")[1]);

    let upgrade = false;
    if (current_timeline === "1M" && incoming_timeline === "1Y") {
      upgrade = true;
    } else if (current_timeline === "1Y" && incoming_timeline === "1M") {
      upgrade = false;
    } else if (current_level < incoming_level) {
      upgrade = true;
    }

    const handleUpgrade = async (product: string) => {
      setModal2({
        ...modal2,
        open: false,
      });
      const res = await makeRequest.post(`/payment/stripe-update-sub`, {
        product_type: product,
      });

      const responseData = await res.data
      if (responseData.message) {
        setModal2({
          ...modal2,
          open: !modal2.open,
          showClose: false,
          offClickClose: true,
          width: "w-[400px]",
          maxWidth: "max-w-[400px]",
          aspectRatio: "aspect-[5/2]",
          borderRadius: "rounded-[12px] md:rounded-[15px]",
          content: <Modal2Close text={responseData.message} />,
        });
      }
    };

    if (upgrade) {
      setModal2({
        ...modal2,
        open: !modal2.open,
        showClose: false,
        offClickClose: true,
        width: "w-[450px] px-[35px]",
        maxWidth: "max-w-[500px]",
        aspectRatio: "aspect-[5/2]",
        borderRadius: "rounded-[12px] md:rounded-[15px]",
        content: (
          <Modal2Continue
            text={
              "Continue to upgrade your subscription and receive an invoice with credit applied from your current plan"
            }
            threeOptions={false}
            onContinue={() => {
              handleUpgrade(product);
            }}
          />
        ),
      });
    } else {
      await handleUpgrade(product);
    }
  };

  const handlePortal = async () => {
    if (!currentUser) return;
    const res = await makeRequest.post(`/payment/stripe-portal`, {});

    const responseData = await res.data
    if (!responseData.success) {
      if (!responseData.message) return
      setModal2({
        ...modal2,
        open: !modal2.open,
        showClose: false,
        offClickClose: true,
        width: "w-[400px]",
        maxWidth: "max-w-[400px]",
        aspectRatio: "aspect-[5/2]",
        borderRadius: "rounded-[12px] md:rounded-[15px]",
        content: <Modal2Close text={responseData.message} />,
      });
    } else if (responseData.url) {
      window.location.href = responseData.url;
    }
  };

  if (!currentUser) return;

  return (
    <div className="w-full h-full flex flex-col pt-[50px]">
      <StripeProvider>
        <div className="w-[90%] ml-[1%] md:ml-[2%] flex flex-col items-center justify-center">
          <p className="font-[600] lg:mb-[20px] mb-[15px] text-[29px] leading-[29px] md:text-[32px] md:leading-[32px] w-[100%] items-start">
            {currentUserSubscription ? "Change Plan" : "Explore Plans"}
          </p>
          <div className="w-[100%] aspect-[1.5/1] md:aspect-[2.5/1] flex justify-between flex-row gap-[10px] md:gap-[15px]">
            {(Object.keys(stripeProducts) as SubscriptionType[])
              .filter((item) => stripeProducts[item].mode === "subscription")
              .map((subscription: SubscriptionType, index: number) => {
                const product = stripeProducts[subscription];
                if (!product) return;
                return (
                  <div
                    className="cursor-pointer dim hover:brightness-75 flex-1 rounded-[7px] flex flex-col justify-center items-center"
                    style={{
                      border: `1px solid ${currentTheme.text_1}`,
                    }}
                    key={index}
                    onClick={() => {
                      if (currentUserSubscription) {
                        handleChangeSubscription(subscription);
                      } else {
                        handleCheckout(subscription);
                      }
                    }}
                  >
                    <div>{product.title}</div>
                    <div>
                      {currentUserSubscription &&
                        currentUserSubscription.subscription_item ===
                          subscription &&
                        "Current Plan"}
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="w-[100%] aspect-[2/1] md:aspect-[3.5/1] mt-[15px] lg:mt-[20px] flex flex-row justify-center gap-[10px] md:gap-[15px]">
            {(Object.keys(stripeProducts) as CreditType[])
              .filter((item) => stripeProducts[item].mode === "payment")
              .map((credit: CreditType, index: number) => {
                const product = stripeProducts[credit];
                if (!product) return;
                return (
                  <div
                    className="max-w-[35%] cursor-pointer dim hover:brightness-75 flex-1 rounded-[7px] flex justify-center items-center"
                    style={{
                      border: `1px solid ${currentTheme.text_1}`,
                    }}
                    key={index}
                    onClick={() => {
                      handleCheckout(credit);
                    }}
                  >
                    {product.title}
                  </div>
                );
              })}
          </div>
        </div>
        {currentUserSubscription && (
          <button
            className="absolute top-[30px] right-[60px] cursor-pointer hover:brightness-90 brightness-100 mt-4 p-2 w-[200px] rounded-[10px]"
            style={{
              backgroundColor: currentTheme.background_2_2,
              color: currentTheme.text_1,
            }}
            onClick={handlePortal}
          >
            Customer Portal
          </button>
        )}
      </StripeProvider>
    </div>
  );
};

export default Subscription;
