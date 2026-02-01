// project/modules/_util/Selection/JobDefinitionSelection.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { JobDefinition } from "@open-dream/shared";
import { useContext, useMemo, useState } from "react";
import { IoTrashSharp } from "react-icons/io5";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { Check } from "lucide-react";

const JobDefinitionSelectCard = ({
  jobDefinition,
  selectedDefinition,
  setSelectedDefinition,
  setSelectedParent,
}: {
  jobDefinition: JobDefinition;
  selectedDefinition: JobDefinition | null;
  setSelectedDefinition: React.Dispatch<
    React.SetStateAction<JobDefinition | null>
  >;
  setSelectedParent: React.Dispatch<React.SetStateAction<JobDefinition | null>>;
}) => {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const { jobDefinitions } = useContextQueries();

  const hasChildren = useMemo(() => {
    const foundChildren = jobDefinitions.filter(
      (def: JobDefinition) => def.parent_job_definition_id === jobDefinition.id
    );
    return foundChildren.length > 0;
  }, [jobDefinitions, jobDefinition]);

  if (!currentUser) return null;

  return (
    <div
      onClick={() => {
        setSelectedDefinition(jobDefinition);
      }}
      key={jobDefinition.job_definition_id}
      style={{
        backgroundColor: currentTheme.background_1_3,
        border:
          selectedDefinition &&
          selectedDefinition.job_definition_id ===
            jobDefinition.job_definition_id
            ? "1px solid " + currentTheme.text_1
            : "1px solid transparent",
      }}
      className={`hover:brightness-[88%] dim cursor-pointer flex justify-between items-center rounded-[10px] px-[20px] py-[10px]`}
    >
      <div className="w-[calc(100%-90px)] truncate">
        <p className="font-semibold truncate">{jobDefinition.type}</p>
        <p style={{ color: currentTheme.text_4 }} className="text-sm truncate">
          {jobDefinition.description}
        </p>
      </div>
      {hasChildren && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedParent(jobDefinition);
            setSelectedDefinition(null)
          }}
          style={{ border: "1px solid " + currentTheme.text_3 }}
          className="cursor-pointer dim hover:brightness-75 flex items-center justify-center h-[36px] rounded-full w-[36px] opacity-[30%]"
        >
          <FaChevronRight size={20} color={currentTheme.text_3} />
        </div>
      )}
    </div>
  );
};

const JobDefinitionSelection = ({
  onSelect,
  onClear,
  clearable,
}: {
  onSelect: (jobDefinition: JobDefinition) => void;
  onClear: () => void;
  clearable: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { jobDefinitions } = useContextQueries();
  const currentTheme = useCurrentTheme();

  const [selectedDefinition, setSelectedDefinition] =
    useState<JobDefinition | null>(null);
  const [selectedParent, setSelectedParent] = useState<JobDefinition | null>(
    null
  );

  const filteredDefinitions = useMemo(() => {
    const currentSelectedId = selectedParent ? selectedParent.id : null;
    return jobDefinitions.filter(
      (definition: JobDefinition) =>
        definition.parent_job_definition_id === currentSelectedId
    );
  }, [selectedParent, jobDefinitions]);

  if (!currentUser) return null;

  return (
    <div className="w-[100%] h-[100%] pl-[50px] lg:pl-[80px] pr-[25px] lg:pr-[55px] pt-[40px] flex flex-col gap-[12px]">
      <div className="flex flex-row justify-between w-[100%] pr-[25px] items-center">
        <div className="flex flex-row gap-[12px] items-center">
          {selectedParent && (
            <div
              onClick={() => {
                setSelectedParent(null);
                setSelectedDefinition(null)
              }}
              style={{ backgroundColor: currentTheme.background_3 }}
              className="cursor-pointer mt-[3px] dim hover:brightness-75 flex items-center justify-center h-[38px] rounded-full w-[38px] opacity-[30%]"
            >
              <FaChevronLeft size={22} color={currentTheme.text_3} />
            </div>
          )}
          <div className="flex flex-row gap-[13px] flex-1">
            <div className="text-[25px] md:text-[31px] font-[600]  whitespace-nowrap">
              Job Definitions
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-[8px]">
          {clearable && (
            <div
              style={{
                backgroundColor: currentTheme.background_3,
              }}
              onClick={onClear}
              className="w-auto flex flex-row gap-[7px] px-[16px] h-[37px] rounded-full cursor-pointer hover:brightness-75 dim items-center justify-center"
            >
              <p
                className="font-bold text-[15px]"
                style={{
                  color: currentTheme.text_3,
                }}
              >
                Remove
              </p>
              <IoTrashSharp className="w-[19px] h-[19px] opacity-60" />
            </div>
          )}
          {selectedDefinition && (
            <div
              style={{
                backgroundColor: currentTheme.background_3,
              }}
              onClick={() => onSelect(selectedDefinition)}
              className="w-auto flex flex-row gap-[7px] px-[16px] h-[37px] rounded-full cursor-pointer hover:brightness-75 dim items-center justify-center"
            >
              <p
                className="font-bold text-[15px]"
                style={{
                  color: currentTheme.text_3,
                }}
              >
                Select
              </p>
              <Check className="w-[19px] h-[19px] opacity-60" />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-[9px] pr-[25px] flex-1 overflow-auto pb-[30px]">
        {filteredDefinitions.map(
          (jobDefinition: JobDefinition, index: number) => {
            return (
              <JobDefinitionSelectCard
                key={index}
                jobDefinition={jobDefinition}
                selectedDefinition={selectedDefinition}
                setSelectedDefinition={setSelectedDefinition}
                setSelectedParent={setSelectedParent}
              />
            );
          }
        )}
      </div>
    </div>
  );
};

export default JobDefinitionSelection;
