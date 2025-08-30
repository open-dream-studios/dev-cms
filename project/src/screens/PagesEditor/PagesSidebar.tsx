import { AuthContext } from '@/contexts/authContext';
import { ProjectPage } from '@/types/pages';
import { appTheme } from '@/util/appTheme';
import React, { useContext } from 'react'
import { FiEdit } from 'react-icons/fi';

interface PagesSidebarProps {
  filteredActivePages: ProjectPage[];
  setSelectedParentPage: React.Dispatch<React.SetStateAction<ProjectPage | null>>;
  handleContextMenu: (e: React.MouseEvent, page: ProjectPage) => void;
  setEditingPage: React.Dispatch<React.SetStateAction<ProjectPage | null>>;
}

const PagesSidebar = ({ filteredActivePages, setSelectedParentPage, handleContextMenu, setEditingPage }: PagesSidebarProps) => {
  const { currentUser } = useContext(AuthContext)
  if (!currentUser) return null
  return (
    <div
      className="w-[100%] flex flex-col gap-[9px] max-h-[305px] overflow-y-scroll"
    >
      {filteredActivePages.map((page, index) => (
        <div key={page.id} className="w-full relative">
          <div
            onClick={() => setSelectedParentPage(page)}
            onContextMenu={(e) => handleContextMenu(e, page)}
            className="dim hover:brightness-[85%] dim group cursor-pointer w-full h-[50px] flex justify-between items-center pl-[18px] pr-[12px] rounded-[8px]"
            style={{ color: appTheme[currentUser.theme].text_4, backgroundColor: appTheme[currentUser.theme].background_1_2, }}
          >
            <p className="select-none truncate w-[calc(100%-40px)]">{page.title}</p>
            {currentUser.admin && <div
              onClick={(e) => {
                e.stopPropagation();
                setEditingPage(page);
              }}
              className="hover:brightness-90 dim flex items-center justify-center min-w-[30px] w-[33px] h-[33px] rounded-full dim cursor-pointer"
              style={{
                backgroundColor:
                  appTheme[currentUser.theme].background_2_selected,
              }}
            >
              <FiEdit size={15} />
            </div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default PagesSidebar