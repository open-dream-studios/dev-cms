// project/src/hooks/useModules.tsx

export function useModules() {
  const handleRunModule = async (identifier: string) => {
    // if (!currentProject) return;
    // if (
    //   projectModules.some(
    //     (projectModule: ProjectModule) =>
    //       projectModule.identifier === identifier
    //   )
    // ) {
    //   await runFrontendModule(identifier, {
    //     modules,
    //     projectModules,
    //     integrations,
    //     localData,
    //     currentProject,
    //   });
    // }
  };

  return {
    handleRunModule,
  };
}
