// project/src/modules/PagesModule/PagesModuleTopBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import CustomButton from "@/lib/blocks/CustomButton";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { makeRequest } from "@/util/axios";
import { domainToUrl } from "@/util/functions/Pages";
import { Link2 } from "lucide-react";
import { useContext } from "react";

const PagesModuleTopBar = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentProject, currentPage } = useCurrentDataStore();

  const handleLinkClick = () => {
    if (!currentProject || !currentProject.domain) return;
    const slug = currentPage ? currentPage.slug : "";
    window.open(domainToUrl(currentProject.domain + slug));
  };

  const handleGetDataClick = async () => {
    if (!currentProject) return;
    const res = await makeRequest.post("/pages/get-data", {
      domain: currentProject.domain,
      slug: currentPage ? currentPage.slug : "/",
    });
    console.log(res.data);
  };

  if (!currentUser) return null;

  return (
    <div
      className="flex items-center justify-end md:justify-between px-4 h-[100%]"
      style={{
        borderBottom: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="hidden md:flex gap-2 items-center ml-[1px]"></div>
      <div className="flex gap-2">
        <CustomButton onClick={handleGetDataClick} variant="outline">
          <Link2 size={16} />
        </CustomButton>

        <CustomButton onClick={handleLinkClick} variant="outline">
          <Link2 size={16} />
        </CustomButton>
      </div>
    </div>
  );
};

export default PagesModuleTopBar;
