//project/src/screens/AdminHome/AdminHome.tsx
import { AuthContext } from "@/contexts/authContext";
import { Project } from "@/types/project";
import { appTheme } from "@/util/appTheme";
import React, { useContext, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { useContextQueries } from "@/contexts/queryContext";
import MultiStepModalInput, { StepConfig } from "@/modals/Modal2MultiStepInput";
import { useModal1Store, useModal2Store } from "@/store/useModalStore";
import { IoCloseOutline } from "react-icons/io5";
import Modal2Continue from "@/modals/Modal2Continue";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectContext } from "@/contexts/projectContext";
import { LuBlocks } from "react-icons/lu";
import EditModules from "./EditModules";
import { FiEdit } from "react-icons/fi";

const ProjectItem = ({
  project,
  editProjectsMode,
}: {
  project: Project;
  editProjectsMode: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { setCurrentProject } = useProjectContext();
  const { deleteProject } = useContextQueries();
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const handleProjectClick = () => {
    setCurrentProject(project);
  };

  const handleConfirmDelete = () => {
    if (!currentUser) return null;
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={`Delete project ${project.name}?`}
          onContinue={handleDeleteProject}
          threeOptions={false}
        />
      ),
    });
  };

  const handleDeleteProject = async () => {
    await deleteProject(project);
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      {editProjectsMode && (
        <div
          style={{
            border: `1px solid ${appTheme[currentUser.theme].text_4}`,
            backgroundColor: appTheme[currentUser.theme].background_1,
          }}
          className="absolute top-[-8px] right-[-9px] z-[350] w-[26px] h-[26px] flex items-center justify-center dim hover:brightness-75 cursor-pointer rounded-[20px]"
          onClick={handleConfirmDelete}
        >
          <IoCloseOutline color={appTheme[currentUser.theme].text_2} />
        </div>
      )}
      <div
        onClick={handleProjectClick}
        className="dim cursor-pointer hover:brightness-75 w-[100%] h-[100px] rounded-[10px] px-[30px] py-[20px] gap-[5px] flex flex-col"
        style={{ backgroundColor: appTheme[currentUser.theme].background_1_2 }}
      >
        <p
          className="text-[20px] font-bold truncate"
          style={{ color: appTheme[currentUser.theme].text_1 }}
        >
          {project.name}
        </p>
        <p
          className="text-[15px] font-[300] truncate"
          style={{ color: appTheme[currentUser.theme].text_1 }}
        >
          {project.domain}
        </p>
      </div>
    </div>
  );
};

const AdminHome = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const { projectsData, addProject, isLoadingProjects } = useContextQueries();

  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  if (isLoadingProjects) return <p>Loading projects...</p>;

  const handleAddProjectClick = () => {
    const steps: StepConfig[] = [
      {
        name: "name",
        placeholder: "Enter Project Name",
        validate: (val) => (val.length > 1 ? true : "2+ characters required"),
      },
      {
        name: "domain",
        placeholder: "Enter Domain (optional)",
        validate: () => true, // always valid (optional field)
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
        <MultiStepModalInput
          steps={steps}
          onComplete={async (values) => {
            await addNewProject(values.name, values.domain);
          }}
        />
      ),
    });
  };

  const addNewProject = async (name: string, domain?: string) => {
    if (!name) return;
    await addProject({ name, domain: domain || undefined });
    queryClient.invalidateQueries({ queryKey: ["projectUsers"] });
  };

  const [editProjectsMode, setEditProjectsMode] = useState<boolean>(false);

  if (!currentUser) return null;

  return (
    <div className="w-[100%] h-[100%] relative">
      {currentUser.admin === 1 && (
        <div className="flex flex-row w-[100%] h-[70px] items-center px-[50px]">
          <div className="flex flex-row gap-[11.5px] ">
            <h2 className="text-[30px] leading-[35px] ml-[4px] font-bold mr-[7px]">
              Projects
            </h2>

            <div className="flex flex-row gap-[12px]">
              <div
                onClick={handleAddProjectClick}
                className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
                }}
              >
                <FaPlus size={16} />
              </div>
              
              <div
                onClick={() => {
                  setEditProjectsMode((prev) => !prev);
                }}
                className="dim hover:brightness-75 cursor-pointer w-[36px] h-[36px] rounded-full flex justify-center items-center"
                style={{
                  border: editProjectsMode
                    ? "1.4px solid" + appTheme[currentUser.theme].text_3
                    : "none",
                  backgroundColor: appTheme[currentUser.theme].background_1_2,
                }}
              >
                <FiEdit size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-[100%] h-[100%] px-[100px] pt-[60px] flex flex-col overflow-y-scroll">
        <div className="max-w-[1200px] mb-[50px] w-[100%] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[21px]">
          {projectsData.map((project: Project, index: number) => (
            <ProjectItem
              key={index}
              project={project}
              editProjectsMode={editProjectsMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
