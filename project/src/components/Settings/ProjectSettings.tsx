// project/src/components/Settings/Account.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext";
import { useProjectSettingsForm } from "@/hooks/useProjectSettingsForm";
import { Project } from "@/types/project";
import { appTheme } from "@/util/appTheme";
import { ProjectSettingsFormData } from "@/util/schemas/projectSettingsSchema";
import { useContext, useEffect, useMemo } from "react";
import { FaPlus } from "react-icons/fa6";
import UploadModal from "../Upload/Upload";
import { useAppContext } from "@/contexts/appContext";

const ProjectSettings = () => {
  const { currentProjectId } = useProjectContext();
  const { currentUser } = useContext(AuthContext);
  const { updateProject, projectsData } = useContextQueries();
  const { setUploadPopup } = useAppContext();

  const currentProjectData = projectsData.find(
    (p) => p.id === currentProjectId
  );

  if (!currentUser || !currentProjectData) return null;

  const form = useProjectSettingsForm({
    name: currentProjectData.name,
    short_name: currentProjectData.short_name,
    domain: currentProjectData.domain,
    logo: currentProjectData.logo,
    backend_domain: currentProjectData.backend_domain,
    brand: currentProjectData.brand,
  });

  useEffect(() => {
    form.reset({
      name: currentProjectData.name,
      short_name: currentProjectData.short_name,
      domain: currentProjectData.domain,
      logo: currentProjectData.logo,
      backend_domain: currentProjectData.backend_domain,
      brand: currentProjectData.brand,
    });
  }, [currentProjectData, form]);

  const onSubmit = async (data: ProjectSettingsFormData) => {
    await updateProject({
      project_idx: currentProjectData.id,
      ...data,
    });
    form.reset(data);
  };

  const onLogoSubmit = async (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    form.setValue("logo", urls[0], { shouldDirty: true });
    const data = form.getValues();
    await onSubmit(data);
  };

  const isDirty = form.formState.isDirty;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (err) => {
        console.log("Validation failed:", err);
      })}
      // onSubmit={form.handleSubmit(onSubmit)}
      className="relative ml-[5px] md:ml-[8px] w-[calc(100%-43px)] sm:w-[calc(100%-80px)] h-full flex flex-col pt-[50px]"
    >
      <UploadModal
        multiple={false}
        onUploaded={async (urls) => {
          await onLogoSubmit(urls);
        }}
      />
      <div
        style={{
          ["--custom-input-text-color" as any]:
            appTheme[currentUser.theme].text_3,
        }}
        className="ml-[1px] flex flex-row gap-[13.5px] items-center lg:mb-[18px] mb-[14px]"
      >
        <input
          {...form.register("brand")}
          placeholder="Brand..."
          className="input font-[600] h-[40px] text-[29px] leading-[33px] md:text-[32px] md:leading-[35px] mt-[-1px] w-[100%] outline-none"
          style={{ color: "var(--custom-input-text-color)" }}
        />
      </div>

      <div className="w-[100%] min-h-[86px] flex flex-row gap-[20px]">
        <div className="aspect-[1/1] h-[100%] max-h-[86px] flex items-center justify-center">
          {currentProjectData.logo !== null ? (
            <div
              onClick={() => setUploadPopup(true)}
              className="h-[100%] aspect-[1/1] rounded-[15px] overflow-hidden cursor-pointer relative group"
              // style={{ borderColor: appTheme[currentUser.theme].text_4 }}
            >
              <img
                className="h-[100%] w-[100%] object-cover transition duration-400 group-hover:brightness-50"
                src={currentProjectData.logo}
              />

              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                <FaPlus size={25} color={appTheme[currentUser.theme].text_2} />
              </div>
            </div>
          ) : (
            <div
              onClick={() => setUploadPopup(true)}
              className="hover:brightness-75 dim cursor-pointer h-[100%] aspect-[1/1] rounded-[15px] flex items-center justify-center"
              style={{
                border: "0.5px solid " + appTheme[currentUser.theme].text_3,
              }}
            >
              <FaPlus size={25} color={appTheme[currentUser.theme].text_3} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[10px] w-[100%]">
          <div
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2,
              ["--custom-input-text-color" as any]:
                appTheme[currentUser.theme].text_3,
            }}
            className="py-[12px] px-[19px] rounded-[10px]"
          >
            <input
              {...form.register("name")}
              placeholder="Project Name..."
              className="input font-[400] text-[17px] mt-[-1px] w-[100%] outline-none"
              style={{ color: "var(--custom-input-text-color)" }}
            />
          </div>

          <div
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2,
              ["--custom-input-text-color" as any]:
                appTheme[currentUser.theme].text_3,
            }}
            className="py-[12px] px-[19px] rounded-[10px]"
          >
            <input
              {...form.register("domain")}
              placeholder="Domain..."
              className="input font-[400] text-[17px] mt-[-1px] w-[100%] outline-none"
              style={{ color: "var(--custom-input-text-color)" }}
            />
          </div>

          <div
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2,
              ["--custom-input-text-color" as any]:
                appTheme[currentUser.theme].text_3,
            }}
            className="py-[12px] px-[19px] rounded-[10px]"
          >
            <input
              {...form.register("backend_domain")}
              placeholder="Backend Domain..."
              type="text"
              className="font-[400] text-[17px] mt-[-1px] w-[100%] outline-none"
              style={{ color: "var(--custom-input-text-color)" }}
            />
          </div>

          <div
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2,
              ["--custom-input-text-color" as any]:
                appTheme[currentUser.theme].text_3,
            }}
            className="py-[12px] px-[19px] rounded-[10px]"
          >
            <input
              {...form.register("short_name")}
              placeholder="Abbreviation..."
              className="input font-[400] text-[17px] mt-[-1px] w-[100%] outline-none"
              style={{ color: "var(--custom-input-text-color)" }}
            />
          </div>

          {isDirty && (
            <div className="w-[100%] justify-end flex gap-[9px] flex-row">
              <button
                type="submit"
                className="cursor-pointer hover:brightness-90 dim px-[15px] h-[32px] rounded-full text-sm dim"
                style={{
                  backgroundColor:
                    appTheme[currentUser.theme].background_2_selected,
                  color: appTheme[currentUser.theme].text_4,
                }}
              >
                Save
              </button>
              <div
                onClick={() => form.reset()}
                className="items-center flex justify-center cursor-pointer hover:brightness-90 dim px-[15px] h-[32px] rounded-full text-sm dim"
                style={{
                  backgroundColor:
                    appTheme[currentUser.theme].background_2_selected,
                  color: appTheme[currentUser.theme].text_4,
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
