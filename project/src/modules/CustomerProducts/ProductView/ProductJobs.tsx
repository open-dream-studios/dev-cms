// project/src/modules/CustomerProducts/ProductView/ProductJobs.tsx
import { AuthContext } from "@/contexts/authContext"; 
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useModal1Store, useModal2Store } from "@/store/useModalStore";
import { Job, JobDefinition } from "@/types/jobs";
import { Product } from "@/types/products";
import { appTheme } from "@/util/appTheme";
import { useContext, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";

interface ProductJobsProps {
  product: Product | null;
  customerId: number | null;
}

const ProductJobs = ({ product, customerId }: ProductJobsProps) => {
  const { currentUser } = useContext(AuthContext);
  const { currentProject } = useCurrentDataStore()
  const {
    upsertJobDefinition,
    jobDefinitions,
    deleteJobDefinition,
    upsertJob,
  } = useContextQueries();

  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    job_definition_id: string | null;
  } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const menu = document.getElementById("context-menu");
      if (menu && !menu.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const handleContextMenu = (
    e: React.MouseEvent,
    job_definition_id: string | null
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      job_definition_id,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleAddJobDefinition = async () => {
    const steps: StepConfig[] = [
      {
        name: "type",
        placeholder: "Job Type...",
        validate: (val) => (val.length > 1 ? true : "2+ characters required"),
      },
      {
        name: "description",
        placeholder: "Description...",
        validate: (val) => (val.length > 1 ? true : "2+ characters required"),
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
          onComplete={async (values) => {
            await upsertJobDefinition({
              job_definition_id: null,
              type: values.type,
              description: values.description,
            });
          }}
        />
      ),
    });
  };

  const handleSelectJob = async (definition: JobDefinition) => {
    if (!product || !definition.id) return;
    await upsertJob({
      job_id: null,
      job_definition_id: definition.id,
      product_id: product.id,
      customer_id: customerId,
      status: "waiting_work",
      priority: "medium",
      scheduled_start_date: null,
      completed_date: null,
      notes: null,
    } as Job);
    setModal1({
      ...modal1,
      open: false,
    });
  };

  const handleDeleteJob = async () => {
    if (contextMenu && contextMenu.job_definition_id) {
      await deleteJobDefinition(contextMenu.job_definition_id);
    }
  };

  if (!currentUser || !currentProject) return null;

  return (
    <div className="w-[100%] h-[100%] pl-[50px] lg:pl-[80px] pr-[25px] lg:pr-[55px] pt-[40px] flex flex-col gap-[12px]">
      {currentUser.admin === 1 && contextMenu && (
        <div
          id="context-menu"
          className="fixed z-50 shadow-lg rounded-md py-1 w-40 animate-fade-in"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: appTheme[currentUser.theme].background_3_2,
            border: `1px solid ${appTheme[currentUser.theme].background_4}`,
          }}
        >
          <button
            onClick={() => {
              handleDeleteJob();
              handleCloseContextMenu();
            }}
            style={{
              backgroundColor: appTheme[currentUser.theme].background_3_2,
            }}
            className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:brightness-75 dim"
          >
            Delete Job
          </button>
        </div>
      )}
      <div className="flex flex-row justify-between w-[100%] pr-[25px] items-center">
        <div className="text-[25px] md:text-[31px] font-[600]">
          {currentProject.short_name} Jobs
        </div>
        {currentUser.admin === 1 && <div
          style={{
            backgroundColor: appTheme[currentUser.theme].background_3,
          }}
          onClick={handleAddJobDefinition}
          className="w-[40px] h-[40px] rounded-full cursor-pointer hover:brightness-75 dim flex items-center justify-center"
        >
          <FaPlus className="w-[20px] h-[20px] opacity-60" />
        </div>}
      </div>
      <div className="flex flex-col gap-[10px] pr-[25px] flex-1 overflow-auto pb-[30px]">
        {jobDefinitions.map((definition: JobDefinition, index: number) => {
          return (
            <div
              key={index}
              onContextMenu={(e: any) =>
                handleContextMenu(e, definition.job_definition_id)
              }
              style={{
                backgroundColor: appTheme[currentUser.theme].background_3,
              }}
              onClick={() => handleSelectJob(definition)}
              className="cursor-pointer hover:brightness-[86%] dim px-[18px] py-[5px] w-[100%] min-h-[60px] rounded-[12px] flex flex-row items-center"
            >
              <div className="w-[100%] h-[100%] items-center flex flex-row gap-[10px]">
                <div className="flex h-[100%] w-[100%] flex-col justify-center">
                  <div className="flex flex-row justify-between w-[100%]">
                    <div className="font-[600] text-[17px] leading-[19px]">
                      {definition.type}
                    </div>
                  </div>

                  <div className="flex flex-row justify-between w-[100%]">
                    {definition.description && (
                      <div className="font-[500] text-[14px] opacity-[0.3]">
                        {definition.description ?? ""}
                      </div>
                    )}
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

export default ProductJobs;
