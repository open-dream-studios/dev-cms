// project/src/modules/PagesModule/PagesEditorToolbar.tsx
import { AuthContext } from "@/contexts/authContext";
import CustomButton from "@/lib/blocks/CustomButton";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { appTheme } from "@/util/appTheme";
import { domainToUrl } from "@/util/functions/Pages";
import { Link2 } from "lucide-react";
import { useContext } from "react";

// type Props = {
//   view: "grid" | "list";
//   setView: (v: "grid" | "list") => void;
//   onUploadClick: () => void;
//   editeMode: boolean;
//   setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
//   activeFolder: MediaFolder | null;
// };

const PagesEditorToolbar = () =>
  //   {
  //   view,
  //   setView,
  //   onUploadClick,
  //   editeMode,
  //   setEditMode,
  //   activeFolder
  // }: Props
  {
    const { currentUser } = useContext(AuthContext);
    const { currentProject, currentPage } = useCurrentDataStore();

    const handleLinkClick = () => {
      if (!currentProject || !currentProject.domain) return;
      const slug = currentPage ? currentPage.slug : "";
      window.open(domainToUrl(currentProject.domain + slug));
    };

    const handleGetDataClick = async () => {
      if (!currentProject) return;
      // const data = await makeRequest.post("/api/pages/get-data", {
      //   domain: currentProject.domain,
      //   slug: currentPage ? currentPage.slug : "/",
      // });
      try {
        console.log("getting data");
        const domain = "tannyspaacquisitions.com";
        const slug = "/";

        const apiUrl =
          "https://dev-cms-production.up.railway.app/api/pages/get-data";
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ domain, slug }),
        });

        if (!res.ok) {
          throw new Error("API request failed");
        }

        const result = await res.json();
        console.log(result);
      } catch (err) {
        console.error("❌ Error fetching page data:", err);
      }
      // console.log(data);
    };

    if (!currentUser) return null;

    return (
      <div
        className="flex items-center justify-end md:justify-between px-4 py-2"
        style={{
          borderBottom: `0.5px solid ${
            appTheme[currentUser.theme].background_2
          }`,
        }}
      >
        <div className="hidden md:flex gap-2 items-center ml-[1px]">
          {/* <CustomButton onClick={
          // () => setView("grid")
          () => {}
          } variant="switch" active={view === "grid"}>
          <Grid size={15} />
          <p className="font-[500] text-[14px]">
            Grid
          </p>
        </CustomButton> */}

          {/* <CustomButton onClick={() => setView("list")} variant="switch" active={view === "list"}>
          <List size={17} />
          <p className="font-[500] text-[14px]">
            List
          </p>
        </CustomButton> */}

          {/* <p className="text-[24px] font-[700] mt-[-2px] px-[10.5px]">
            {"All Media"}
          </p> */}
        </div>
        <div className="flex gap-2">
          <CustomButton onClick={handleGetDataClick} variant="outline">
            <Link2 size={16} />
          </CustomButton>

          <CustomButton onClick={handleLinkClick} variant="outline">
            <Link2 size={16} />
          </CustomButton>

          {/* <CustomButton onClick={onUploadClick} variant="fill">
          <Upload size={16} />
          <p className="font-[500] text-[14px]">
            Upload
          </p>
        </CustomButton> */}
        </div>
      </div>
    );
  };

export default PagesEditorToolbar;
