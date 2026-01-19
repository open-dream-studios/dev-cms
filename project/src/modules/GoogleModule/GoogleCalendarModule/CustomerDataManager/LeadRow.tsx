// project/src/modules/GoogleModule/GoogleCalendarModule/CustomerDataManager/LeadRow.tsx
import React, { useContext, useEffect, useMemo } from "react";
import { Briefcase, ChevronDown, Package, Plus } from "lucide-react";
import {
  Customer,
  JobDefinition,
  Lead,
  LeadInput,
  LeadStatus,
  LeadType,
  leadTypes,
  Product,
} from "@open-dream/shared";
import { getInnerCardStyle } from "@/styles/themeStyles";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import {
  setCurrentCustomerData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { formatDateTime } from "@/util/functions/Time";
import { useCustomerDataUIStore } from "./_store/customerData.store";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { formatPhoneNumber } from "@/util/functions/Customers";
import { useRouting } from "@/hooks/useRouting";
import { useLeadForm } from "@/hooks/forms/useLeadForm";
import { LeadFormData, leadToForm } from "@/util/schemas/leadSchema";
import { HiArrowLongRight } from "react-icons/hi2";
import { useWatch } from "react-hook-form";
import { useUiStore } from "@/store/useUIStore";
import CustomerSelection from "@/modules/_util/Selection/CustomerSelection";
import { BiPencil } from "react-icons/bi";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { createLeadContextMenu } from "./_actions/customerData.actions";
import JobDefinitionSelection from "@/modules/_util/Selection/JobDefinitionSelection";
import ProductSelection from "@/modules/_util/Selection/ProductSelection";

export const leadStatusColors: Record<LeadStatus, string> = {
  // new: "rgba(59,130,246,0.18)",
  new: "rgba(129, 215, 248, 0.18)",
  followup_suggested: "rgba(139,92,246,0.22)",
  waiting_response: "rgba(245,158,11,0.22)",
  converted: "rgba(34,197,94,0.22)",
  on_hold: "rgba(148,163,184,0.22)",
  lost: "rgba(239,68,68,0.22)",
};

export const leadStatusTextColors: Record<LeadStatus, string> = {
  // new: "#3B82F6",
  new: "#00BBF8",
  followup_suggested: "#A87BFF",
  waiting_response: "#F59E0B",
  converted: "#22C55E",
  on_hold: "#94A3B8",
  lost: "#EF4444",
};

const leadStatusLabels: Record<LeadStatus, string> = {
  new: "New",
  followup_suggested: "Follow-up",
  waiting_response: "Waiting",
  converted: "Converted",
  on_hold: "On Hold",
  lost: "Lost",
};

/* ---------------- Component ---------------- */

const LeadRow = ({ lead }: { lead: Lead | null }) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { modal1, setModal1 } = useUiStore();
  const { upsertLead, customers, productsData, jobDefinitions } =
    useContextQueries();
  const { currentProjectId } = useCurrentDataStore();
  const { editingLead, setEditingLead, isAddingLead, setIsAddingLead } =
    useCustomerDataUIStore();
  const { screenClick } = useRouting();
  const { openContextMenu } = useContextMenuStore();

  const leadForm = useLeadForm();
  const lead_type = useWatch({ control: leadForm.control, name: "lead_type" });
  const lead_customer_id = useWatch({
    control: leadForm.control,
    name: "customer_id",
  });
  const lead_status = useWatch({
    control: leadForm.control,
    name: "status",
  });
  const lead_job_definition_id = useWatch({
    control: leadForm.control,
    name: "job_definition_id",
  });
  const lead_product_id = useWatch({
    control: leadForm.control,
    name: "product_id",
  });
  const lead_notes = useWatch({
    control: leadForm.control,
    name: "notes",
  });

  const isEditingOrAdding = !!(
    isAddingLead ||
    (lead && editingLead?.lead_id === lead.lead_id)
  );

  useEffect(() => {
    leadForm.reset(leadToForm(lead));
  }, [leadForm, lead]);

  const matchedProduct = useMemo(() => {
    if (lead_type === "product" && lead_product_id) {
      return productsData.find(
        (product: Product) => product.product_id === lead_product_id
      );
    }
    return null;
  }, [productsData, lead_product_id, lead_type]);

  const matchedService = useMemo(() => {
    if (lead_type === "service" && lead_job_definition_id) {
      return jobDefinitions.find(
        (definition: JobDefinition) =>
          definition.job_definition_id === lead_job_definition_id
      );
    }
    return null;
  }, [jobDefinitions, lead_job_definition_id, lead_type]);

  const handleLeadTargetClick = async () => {
    if (editingLead) {
      handleEditInterestItemClick();
    } else {
      if (lead_type === "product" && matchedProduct) {
        await screenClick(
          "customer-products",
          `/products/${matchedProduct.serial_number}`
        );
      }
    }
  };

  const onSelectCustomer = (customer: Customer) => {
    leadForm.setValue("customer_id", customer.customer_id, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setModal1({ ...modal1, open: false });
  };

  const handleLeadClick = async () => {
    if (isAddingLead) return;
    if (editingLead) {
      setEditingLead(null);
      const { dirtyFields } = leadForm.formState;
      if (Object.keys(dirtyFields).length > 0 && currentProjectId) {
        const formInput = {
          lead_id: lead && lead.lead_id ? lead.lead_id : null,
          project_idx: currentProjectId,
          customer_id: lead_customer_id,
          product_id: lead_product_id,
          job_definition_id: lead_job_definition_id,
          lead_type: lead_type,
          notes: lead_notes,
          status: lead_status,
          source: null,
        } as LeadInput;
        await saveForm(formInput);
      }
      handleCancelForm();
    } else {
      setEditingLead(lead);
    }
  };

  const onSelectJobDefinition = (jobDefinition: JobDefinition) => {
    leadForm.setValue("job_definition_id", jobDefinition.job_definition_id, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setModal1({ ...modal1, open: false });
  };

  const onClearJobDefinition = () => {
    leadForm.setValue("job_definition_id", null, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setModal1({ ...modal1, open: false });
  };

  const onSelectProduct = (product: Product) => {
    leadForm.setValue("product_id", product.product_id, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setModal1({ ...modal1, open: false });
  };

  const onClearProduct = () => {
    leadForm.setValue("product_id", null, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setModal1({ ...modal1, open: false });
  };

  const handleEditInterestItemClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content:
        lead_type === "service" ? (
          <JobDefinitionSelection
            onSelect={onSelectJobDefinition}
            onClear={onClearJobDefinition}
            clearable={!!lead_job_definition_id}
          />
        ) : (
          <ProductSelection
            onSelect={onSelectProduct}
            onClear={onClearProduct}
            clearable={!!lead_product_id}
          />
        ),
    });
  };

  useEffect(() => {
    if (isEditingOrAdding) {
      requestAnimationFrame(() => {
        leadForm.setFocus("notes");
      });
    }
  }, [isEditingOrAdding, leadForm]);

  const handleStatusChange = async (status: LeadStatus) => {
    if (!lead) return;
    await upsertLead({
      ...lead,
      lead_id: lead.lead_id,
      project_idx: currentProjectId,
      status,
    } as LeadInput);
  };

  const handleCancelForm = () => {
    setIsAddingLead(false);
    setEditingLead(null);
    leadForm.reset(leadToForm(lead));
  };

  const handleEditCustomerClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: (
        <CustomerSelection
          onSelect={onSelectCustomer}
          onClear={() => {}}
          clearable={false}
        />
      ),
    });
  };

  const leadCustomer = useMemo(() => {
    if (isEditingOrAdding) {
      if (!lead_customer_id) return null;
      return customers.find(
        (customer: Customer) => customer.customer_id === lead_customer_id
      );
    } else {
      if (!lead || !lead.customer_id) return null;
      return customers.find(
        (customer: Customer) => customer.customer_id === lead.customer_id
      );
    }
  }, [customers, lead_customer_id, lead, isEditingOrAdding]);

  const onFormSubmitButton = async (data: LeadFormData) => {
    if (!currentProjectId) return;
    const formInput = {
      lead_id: lead && lead.lead_id ? lead.lead_id : null,
      project_idx: currentProjectId,
      customer_id: data.customer_id,
      product_id: data.product_id,
      job_definition_id: data.job_definition_id,
      lead_type: data.lead_type,
      notes: data.notes,
      status: data.status,
      source: null,
    } as LeadInput;
    await saveForm(formInput);
  };

  const saveForm = async (formInput: LeadInput) => {
    await upsertLead(formInput);
    setEditingLead(null);
    setIsAddingLead(false);
  };

  if (!currentUser) return null;

  return (
    <form
      onSubmit={leadForm.handleSubmit(onFormSubmitButton)}
      className={`${
        lead &&
        editingLead &&
        editingLead.lead_id !== lead.lead_id &&
        "opacity-[0.35]"
      } rounded-xl transition-all duration-200`}
      style={getInnerCardStyle(currentUser.theme, currentTheme)}
    >
      <div
        onClick={handleLeadClick}
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu({
            position: { x: e.clientX, y: e.clientY },
            target: lead,
            menu: createLeadContextMenu(),
          });
        }}
        className={`flex items-center gap-[11px] px-[10px] h-[60px] py-[8px] ${
          !isAddingLead && "cursor-pointer"
        } ${!isEditingOrAdding && "group"}`}
      >
        {leadCustomer ? (
          <div
            style={getInnerCardStyle(currentUser.theme, currentTheme)}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditingOrAdding) {
                handleEditCustomerClick();
              } else {
                setCurrentCustomerData(leadCustomer, true);
              }
            }}
            className="group-hover:brightness-75 w-[200px] h-[44px] flex items-center px-[10px] flex-row gap-[8px] rounded-[10px] hover:brightness-65 dim cursor-pointer"
          >
            <div
              className="select-none flex items-center justify-center rounded-full border font-semibold text-[11px] min-w-[28px] min-h-[28px]"
              style={{
                borderColor: currentTheme.text_4,
                color: currentTheme.text_4,
              }}
            >
              {isEditingOrAdding ? (
                <BiPencil size={15} />
              ) : (
                <>
                  {`${leadCustomer.first_name?.[0] ?? ""}${
                    leadCustomer.last_name?.[0] ?? ""
                  }`.toUpperCase()}
                </>
              )}
            </div>

            <div className="flex flex-col items-start justify-start overflow-hidden h-[100%] mt-[8.5px]">
              <p className="w-full font-bold text-[13px] leading-[15px] truncate">
                {capitalizeFirstLetter(leadCustomer.first_name)}{" "}
                {capitalizeFirstLetter(leadCustomer.last_name)}
              </p>

              <div className="w-[100%] flex flex-row text-[13px] leading-[19px] opacity-70 truncate">
                {leadCustomer.phone && (
                  <p>{formatPhoneNumber(leadCustomer.phone)}</p>
                )}
                {!leadCustomer.phone && leadCustomer.email && (
                  <p className="truncate">{leadCustomer.email}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={getInnerCardStyle(currentUser.theme, currentTheme)}
            onClick={(e) => {
              e.stopPropagation();
              handleEditCustomerClick();
            }}
            className="group-hover:brightness-75 w-[158px] h-[44px] flex items-center px-[10px] flex-row gap-[10px] rounded-[10px] hover:brightness-65 dim cursor-pointer"
          >
            <div
              className="select-none flex items-center justify-center rounded-full border font-semibold text-[11px] min-w-[22px] min-h-[22px]"
              style={{
                border: "1px solid " + currentTheme.background_4,
                color: currentTheme.text_4,
              }}
            >
              <Plus size={12} className="opacity-[0.9]" />
            </div>

            <p className="mt-[-1.5px] font-[500] text-[13px] leading-[18px] opacity-[0.6]">
              Add Customer
            </p>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-[1.5px]">
          <div className="text-[13px] font-[500] flex flex-row gap-[8px]">
            <div
              style={{ border: "1px solid " + currentTheme.background_3 }}
              className={`relative rounded-full pl-[15px] pr-[10px] py-[2px] flex flex-row gap-[2px] items-center group ${
                isEditingOrAdding && "cursor-pointer hover:brightness-90 dim"
              }`}
              onClick={async (e) => {
                if (editingLead) {
                  e.stopPropagation();
                }
              }}
            >
              <div
                className={`select-none group-hover:brightness-75 dim flex flex-row gap-[6px] ${
                  isEditingOrAdding && "group-hover:brightness-60"
                }`}
              >
                {capitalizeFirstLetter(lead_type)}
                <span className="opacity-[0.4] pr-[5px]">Interest</span>
              </div>
              {isEditingOrAdding && (
                <ChevronDown size={13} className="opacity-[0.4]" />
              )}
              {isEditingOrAdding && (
                <select
                  {...leadForm.register("lead_type", {
                    onChange: (e) => {
                      leadForm.setValue("product_id", null, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                      leadForm.setValue("job_definition_id", null, {
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    },
                  })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {leadTypes.map((lead_type: LeadType) => (
                    <option key={lead_type} value={lead_type}>
                      {capitalizeFirstLetter(lead_type)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {(lead_type === "product" && matchedProduct) ||
            (lead_type === "service" && matchedService) ? (
              <div className="flex flex-row gap-[8px] items-center">
                <HiArrowLongRight
                  color={currentTheme.text_3}
                  className="opacity-[0.3]"
                  size={15}
                />

                <div
                  style={{ backgroundColor: currentTheme.background_2 }}
                  className={`rounded-full pl-[16px] pr-[17px] py-[2px] group ${
                    isEditingOrAdding &&
                    "cursor-pointer hover:brightness-95 dim"
                  }`}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeadTargetClick();
                    }}
                    className={`group-hover:brightness-75 dim flex flex-row gap-[7px] items-center ${
                      isEditingOrAdding && "group-hover:brightness-50"
                    }`}
                  >
                    {lead_type === "product" &&
                      matchedProduct &&
                      matchedProduct.serial_number}
                    {lead_type === "service" &&
                      matchedService &&
                      matchedService.type}
                    {isEditingOrAdding && (
                      <ChevronDown
                        size={13}
                        className="opacity-[0.4] mr-[-5px]"
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              isEditingOrAdding && (
                <div
                  className="group w-[25px] h-[25px] rounded-full flex items-center justify-center hover:brightness-95 dim cursor-pointer brightness-110"
                  style={{
                    border: "1px solid " + currentTheme.background_3,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditInterestItemClick();
                  }}
                >
                  <Plus
                    size={10}
                    className="opacity-[0.5] group-hover:brightness-75 dim"
                  />
                </div>
              )
            )}
          </div>

          <div
            className={`${
              isEditingOrAdding ? "opacity-0" : "opacity-[0.45]"
            } group-hover:brightness-75 dim ml-[5px] h-[14px] text-[12px] leading-[15px] mt-[1.5px] truncate`}
          >
            {lead && lead.notes ? (
              lead.notes
            ) : (
              <div className="ml-[2px] opacity-[0.4] italic">Add Notes...</div>
            )}
          </div>
        </div>

        <div className="justify-start h-[100%] pl-[9px] group-hover:brightness-80 dim flex flex-col gap-[4px] w-auto items-end">
          {lead_status && (
            <div onClick={(e) => e.stopPropagation()}>
              <div
                className="mt-[2px] relative px-3 h-[24px] rounded-full flex items-center gap-[6px] text-[12px] font-[500] cursor-pointer hover:brightness-80 dim"
                style={{
                  background: leadStatusColors[lead_status as LeadStatus],
                  color: leadStatusTextColors[lead_status as LeadStatus],
                }}
              >
                {leadStatusLabels[lead_status as LeadStatus]}
                <ChevronDown size={14} />
                <select
                  {...leadForm.register("status", {
                    onChange: (e) => {
                      if (!isEditingOrAdding) {
                        handleStatusChange(e.target.value as LeadStatus);
                      }
                    },
                  })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {Object.keys(leadStatusLabels).map((status) => (
                    <option key={status} value={status}>
                      {leadStatusLabels[status as LeadStatus]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {lead && (
            <div className="flex flex-row text-[11px] opacity-[0.25] ">
              {isEditingOrAdding ? (
                <div>Currently Editing</div>
              ) : (
                <div className="flex flex-row gap-[5px]">
                  <span>Updated</span>
                  {formatDateTime(lead.updated_at)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditingOrAdding && (
        <div
          className="px-4 pb-3 pt-2 text-[13px] opacity-[0.8]"
          style={{ borderTop: `1px solid ${currentTheme.background_3}` }}
        >
          <textarea
            {...leadForm.register("notes")}
            placeholder="Notes..."
            rows={3}
            className="w-full outline-none resize-none text-[14px] opacity-90 placeholder:opacity-20"
          />

          <div className="mt-[7px] flex flex-row w-full justify-between">
            <div className="flex flex-row gap-[16px] text-[11.5px] opacity-[0.25]">
              {/* <div>
                Created:{" "}
                {formatDateTime(new Date(lead.created_at).toLocaleString())}
              </div> */}
              {lead && (
                <div>
                  Created:{" "}
                  {formatDateTime(new Date(lead.created_at).toLocaleString())}
                </div>
              )}
            </div>
            <div className="flex flex-row gap-[7px]">
              <button
                onClick={handleCancelForm}
                className="px-[15px] py-[2px] mt-[-5px] rounded-full cursor-pointer hover:brightness-90 dim"
                style={{ backgroundColor: currentTheme.background_2 }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-[15px] py-[2px] mt-[-5px] rounded-full cursor-pointer hover:brightness-90 dim"
                style={{ backgroundColor: currentTheme.background_2 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default LeadRow;
