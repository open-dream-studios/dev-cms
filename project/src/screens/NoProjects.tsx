// project/src/screens/NoProjects.tsx
import React, { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { getCardStyle } from "@/styles/themeStyles";

const NoProjects = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <div
        style={getCardStyle(currentUser.theme, currentTheme)}
        className="w-full max-w-md rounded-2xl backdrop-blur-md shadow-xl  p-8 text-center"
      >
        <h1
          style={{
            color: currentTheme.text_2,
          }}
          className="text-xl font-semibold mb-3"
        >
          No projects assigned
        </h1>

        <p
          className="mb-[20px] text-[15px] leading-[24px] font-400"
          style={{
            color: currentTheme.text_3,
          }}
        >
          You have not been assigned to any projects.
          <br />
          Please contact <span>opendreamstudios@gmail.com</span> for project
          access
        </p>
      </div>
    </div>
  );
};

export default NoProjects;
