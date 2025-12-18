// project/src/modules/PagesModule/PagesModule.tsx
"use client";
import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "@/contexts/authContext";
import { ProjectPage, Section } from "@open-dream/shared";
import SiteEditor from "./SiteEditor";
import { domainToUrl, removeTrailingSlash } from "@/util/functions/Pages";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { usePageForm } from "@/hooks/forms/usePageForm";
import { pageToForm } from "@/util/schemas/projectPageSchema";
import { HomeLayout } from "@/layouts/homeLayout";
import PagesModuleTopBar from "./PagesModuleTopBar";
import PagesModuleLeftBar from "./PagesModuleLeftBar";

export type ContextInput = ProjectPage | Section | null;
export type ContextInputType = "page" | "section";

const PagesModule = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProject, currentPage } =
    useCurrentDataStore();
  const { editingPage, addingPage } = useUiStore();
  const { registerForm, unregisterForm } = useFormInstanceStore();

  const pageForm = usePageForm(currentPage);

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const formKey = "page";
    registerForm(formKey, pageForm);
    return () => unregisterForm(formKey);
  }, [pageForm, registerForm, unregisterForm]);

  useEffect(() => {
    if (currentPage) {
      pageForm.reset(pageToForm(currentPage), {
        keepValues: false,
      });
    } else {
      pageForm.reset({}, { keepValues: false });
    }
  }, [currentPage, pageForm]);

  useEffect(() => {
    if (addingPage) {
      firstInputRef.current?.focus();
    }
  }, [addingPage]);

  useEffect(() => {
    if (editingPage) {
      pageForm.reset(pageToForm(editingPage));
    } else if (addingPage) {
      pageForm.reset(pageToForm(null));
    }
  }, [editingPage, addingPage]);

  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const nextUrl = currentProject?.domain
    ? domainToUrl(
        currentPage
          ? currentProject.domain + currentPage.slug
          : currentProject.domain
      )
    : null;

  useEffect(() => {
    if (
      nextUrl &&
      removeTrailingSlash(nextUrl) !== removeTrailingSlash(siteUrl)
    ) {
      setSiteUrl(removeTrailingSlash(nextUrl));
    }
  }, [nextUrl, siteUrl]);

  if (!currentUser || !currentProjectId) return null;

  return (
    <HomeLayout left={<PagesModuleLeftBar />} top={<PagesModuleTopBar />}>
      {currentProject && siteUrl && <SiteEditor src={siteUrl} />}
    </HomeLayout>
  );
};

export default PagesModule;
