// project/src/components/Settings/Account.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import {
  useProjectSettingsForm,
  useProjectSettingsFormSubmit,
} from "@/hooks/forms/useProjectSettingsForm";
import { appTheme } from "@/util/appTheme";
import { projectSettingsToForm } from "@/util/schemas/projectSettingsSchema";
import { useContext, useEffect } from "react";
import { FaPlus } from "react-icons/fa6";
import UploadModal, { CloudinaryUpload } from "../Upload/Upload";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useFormInstanceStore } from "@/store/formInstanceStore";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Project } from "@/types/project";
import { getCardStyle } from "@/styles/themeStyles";

const ProjectSettings = () => {
  const { currentProject } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const { setUploadPopup } = useUiStore();
  const { onProjectSettingsFormSubmit } = useProjectSettingsFormSubmit();
  const projectSettingsForm = useProjectSettingsForm(currentProject);
  const { registerForm, unregisterForm } = useFormInstanceStore();
  const { projectsData, refetchProjects } = useContextQueries();

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  if (!currentUser || !currentProject) return null;

  useEffect(() => {
    const formKey = "projectSettings";
    registerForm(formKey, projectSettingsForm);
    return () => unregisterForm(formKey);
  }, [projectSettingsForm, registerForm, unregisterForm]);

  useEffect(() => {
    const foundProject = projectsData.find(
      (project: Project) => project.id === currentProject.id
    );
    if (foundProject) {
      projectSettingsForm.reset(projectSettingsToForm(foundProject), {
        keepValues: false,
      });
    } else {
      projectSettingsForm.reset(projectSettingsToForm(null), {
        keepValues: false,
      });
    }
  }, [projectsData, projectSettingsForm]);

  const onLogoSubmit = async (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    projectSettingsForm.setValue("logo", urls[0], { shouldDirty: true });
    const data = projectSettingsForm.getValues();
    await onProjectSettingsFormSubmit(data);
  };

  return (
    <form
      onSubmit={projectSettingsForm.handleSubmit(onProjectSettingsFormSubmit)}
      className="relative ml-[5px] md:ml-[8px] w-[calc(100%-43px)] sm:w-[calc(100%-80px)] h-full flex flex-col pt-[50px]"
    >
      <UploadModal
        multiple={false}
        onUploaded={async (uploadObjects: CloudinaryUpload[]) => {
          await onLogoSubmit(
            uploadObjects.map((item: CloudinaryUpload) => item.url)
          );
        }}
      />
      <div
        style={{
          ["--custom-input-text-color" as any]: t.text_3,
        }}
        className="ml-[1px] flex flex-row gap-[13.5px] items-center lg:mb-[18px] mb-[14px]"
      >
        <input
          {...projectSettingsForm.register("brand")}
          placeholder="Brand..."
          className="input font-[600] h-[40px] text-[29px] leading-[33px] md:text-[32px] md:leading-[35px] mt-[-1px] w-[100%] outline-none"
          style={{ color: "var(--custom-input-text-color)" }}
        />
      </div>

      <div className="w-[100%] min-h-[86px] flex flex-row gap-[20px]">
        <div style={getCardStyle(theme, t)} className="rounded-[15px] aspect-[1/1] h-[100%] max-h-[86px] flex items-center justify-center">
          {currentProject.logo !== null ? (
            <div
              onClick={() => setUploadPopup(true)}
              className="hover:brightness-75 dim h-[100%] aspect-[1/1] rounded-[15px] overflow-hidden cursor-pointer relative group"
            >
              <img
                className="h-[100%] w-[100%] object-cover"
                src={currentProject.logo}
              />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                <FaPlus size={25} color={t.text_2} />
              </div>
            </div>
          ) : (
            <div
              onClick={() => setUploadPopup(true)}
              className="hover:brightness-75 dim cursor-pointer h-[100%] aspect-[1/1] rounded-[15px] flex items-center justify-center"
              style={{
                border: "0.5px solid " + t.text_3,
              }}
            >
              <FaPlus size={25} color={t.text_3} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[10px] w-[100%]">
          <div
            style={{
              backgroundColor: t.background_2,
              ["--custom-input-text-color" as any]: t.text_3,
            }}
            className="py-[12px] px-[19px] rounded-[10px]"
          >
            <input
              {...projectSettingsForm.register("name")}
              placeholder="Project Name..."
              className="input font-[400] text-[17px] mt-[-1px] w-[100%] outline-none"
              style={{ color: "var(--custom-input-text-color)" }}
            />
          </div>

          <div
            style={{
              backgroundColor: t.background_2,
              ["--custom-input-text-color" as any]: t.text_3,
            }}
            className="py-[12px] px-[19px] rounded-[10px]"
          >
            <input
              {...projectSettingsForm.register("domain")}
              placeholder="Domain..."
              className="input font-[400] text-[17px] mt-[-1px] w-[100%] outline-none"
              style={{ color: "var(--custom-input-text-color)" }}
            />
          </div>

          <div
            style={{
              backgroundColor: t.background_2,
              ["--custom-input-text-color" as any]: t.text_3,
            }}
            className="py-[12px] px-[19px] rounded-[10px]"
          >
            <input
              {...projectSettingsForm.register("backend_domain")}
              placeholder="Backend Domain..."
              type="text"
              className="font-[400] text-[17px] mt-[-1px] w-[100%] outline-none"
              style={{ color: "var(--custom-input-text-color)" }}
            />
          </div>

          <div
            style={{
              backgroundColor: t.background_2,
              ["--custom-input-text-color" as any]: t.text_3,
            }}
            className="py-[12px] px-[19px] rounded-[10px]"
          >
            <input
              {...projectSettingsForm.register("short_name")}
              placeholder="Abbreviation..."
              className="input font-[400] text-[17px] mt-[-1px] w-[100%] outline-none"
              style={{ color: "var(--custom-input-text-color)" }}
            />
          </div>

          {projectSettingsForm.formState.isDirty && (
            <div className="w-[100%] justify-end flex gap-[9px] flex-row">
              <button
                type="submit"
                className="cursor-pointer hover:brightness-90 dim px-[15px] h-[32px] rounded-full text-sm dim"
                style={{
                  backgroundColor: t.background_2_selected,
                  color: t.text_4,
                }}
              >
                Save
              </button>
              <div
                onClick={() => projectSettingsForm.reset()}
                className="items-center flex justify-center cursor-pointer hover:brightness-90 dim px-[15px] h-[32px] rounded-full text-sm dim"
                style={{
                  backgroundColor: t.background_2_selected,
                  color: t.text_4,
                }}
              >
                Cancel
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProjectSettings;
