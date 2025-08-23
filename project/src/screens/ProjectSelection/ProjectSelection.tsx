import { AuthContext } from "@/contexts/authContext";
import { Project } from "@/types/project";
import { appTheme } from "@/util/appTheme";
import React, { useContext } from "react";
import { FaPlus } from "react-icons/fa6";

const ProjectItem = ({ project }: { project: Project }) => {
  const { currentUser, setCurrentProject } = useContext(AuthContext);

  const handleProjectClick = () => {
    console.log(project);
    setCurrentProject(project.id);
  };

  if (!currentUser) return null;
  return (
    <div
      onClick={handleProjectClick}
      className="dim cursor-pointer hover:brightness-75 w-[100%] min-h-[50px] rounded-[10px] px-[30px] py-[20px] gap-[5px] flex flex-col"
      style={{ backgroundColor: appTheme[currentUser.theme].background_1_2 }}
    >
      <p
        className="text-[20px] font-bold truncate"
        style={{ color: appTheme[currentUser.theme].text_1 }}
      >
        {project.title}
      </p>
      <p
        className="text-[15px] font-[300] truncate"
        style={{ color: appTheme[currentUser.theme].text_1 }}
      >
        {project.subTitle}
      </p>
    </div>
  );
};

const ProjectSelection = () => {
  const { currentUser } = useContext(AuthContext);

  const projects = [
    { title: "hi", subTitle: "hi2", id: 23 },
    { title: "hi", subTitle: "hi2", id: 23 },
    { title: "hi", subTitle: "hi2", id: 23 },
    { title: "hi", subTitle: "hi2", id: 23 },
    { title: "hi", subTitle: "hi2", id: 23 },
  ];

  const handleAddProjectClick = () => {
    console.log("hi");
  };

  if (!currentUser) return null;

  return (
    <div className="w-[100%] h-[100%] py-[50px] px-[100px] overflow-y-scroll flex items-center flex-col">
      <p
        className="w-[100%] text-[39px] font-bold truncate mb-[27px] text-center"
        style={{ color: appTheme[currentUser.theme].text_1 }}
      >
        Select a Project
      </p>
      {true && (
        <div
          onClick={handleAddProjectClick}
          className="dim hover:brightness-75 cursor-pointer absolute top-[30px] right-[30px] w-[50px] h-[50px] rounded-[30px] flex items-center justify-center"
          style={{
            backgroundColor: appTheme[currentUser.theme].text_1,
            color: appTheme[currentUser.theme].background_1,
          }}
        >
          <FaPlus color={appTheme[currentUser.theme].background_1} size={24} />
        </div>
      )}
      <div className="max-w-[1200px] w-[100%] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[21px]">
        {projects.map((project: Project, index: number) => (
          <ProjectItem key={index} project={project} />
        ))}
      </div>
    </div>
  );
};

export default ProjectSelection;
