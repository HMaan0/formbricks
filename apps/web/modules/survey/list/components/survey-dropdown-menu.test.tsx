// Import the actions to access mocked functions
import { deleteSurveyAction } from "@/modules/survey/list/actions";
import { TSurvey } from "@/modules/survey/list/types/surveys";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import toast from "react-hot-toast";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SurveyDropDownMenu } from "./survey-dropdown-menu";

// Cast to mocked functions
const mockDeleteSurveyAction = vi.mocked(deleteSurveyAction);
const mockToast = vi.mocked(toast);

// Mock translation
vi.mock("@tolgee/react", () => ({
  useTranslate: () => ({ t: (key: string) => key }),
}));

// Mock constants
vi.mock("@/lib/constants", () => ({
  IS_FORMBRICKS_CLOUD: false,
  ENCRYPTION_KEY: "test",
  ENTERPRISE_LICENSE_KEY: "test",
  GITHUB_ID: "test",
  GITHUB_SECRET: "test",
  GOOGLE_CLIENT_ID: "test",
  GOOGLE_CLIENT_SECRET: "test",
  AZUREAD_CLIENT_ID: "mock-azuread-client-id",
  AZUREAD_CLIENT_SECRET: "mock-azure-client-secret",
  AZUREAD_TENANT_ID: "mock-azuread-tenant-id",
  OIDC_CLIENT_ID: "mock-oidc-client-id",
  OIDC_CLIENT_SECRET: "mock-oidc-client-secret",
  OIDC_ISSUER: "mock-oidc-issuer",
  OIDC_DISPLAY_NAME: "mock-oidc-display-name",
  OIDC_SIGNING_ALGORITHM: "mock-oidc-signing-algorithm",
  WEBAPP_URL: "mock-webapp-url",
  IS_PRODUCTION: true,
  FB_LOGO_URL: "https://example.com/mock-logo.png",
  SMTP_HOST: "mock-smtp-host",
  SMTP_PORT: "mock-smtp-port",
}));

// Mock external dependencies
vi.mock("@/modules/survey/lib/client-utils", () => ({
  copySurveyLink: vi.fn((url: string, suId?: string) => (suId ? `${url}?suId=${suId}` : url)),
}));

vi.mock("@/modules/survey/list/actions", () => ({
  copySurveyToOtherEnvironmentAction: vi.fn(() => Promise.resolve({ data: { id: "duplicatedSurveyId" } })),
  getSurveyAction: vi.fn(() =>
    Promise.resolve({ data: { id: "duplicatedSurveyId", name: "Duplicated Survey" } })
  ),
  deleteSurveyAction: vi.fn(),
}));

// Mock next/navigation
const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
    push: vi.fn(),
  }),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SurveyDropDownMenu", () => {
  afterEach(() => {
    cleanup();
  });

  test("calls copySurveyLink when copy link is clicked", async () => {
    const mockRefresh = vi.fn().mockResolvedValue("fakeSingleUseId");
    const mockDeleteSurvey = vi.fn();
    const mockDuplicateSurvey = vi.fn();

    render(
      <SurveyDropDownMenu
        environmentId="env123"
        survey={{ ...fakeSurvey, status: "completed" }}
        publicDomain="http://survey.test"
        refreshSingleUseId={mockRefresh}
        deleteSurvey={mockDeleteSurvey}
      />
    );

    // Find the menu wrapper
    const menuWrapper = screen.getByTestId("survey-dropdown-menu");

    // Inside that wrapper, find the actual trigger (div, button, etc.)
    // By default, the trigger is the first clickable child
    const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
    expect(triggerElement).toBeInTheDocument();

    // Use userEvent to mimic real user interaction
    await userEvent.click(triggerElement);

    // Click copy link
    const copyLinkButton = screen.getByTestId("copy-link");
    fireEvent.click(copyLinkButton);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test("shows edit and delete items when not disabled", async () => {
    render(
      <SurveyDropDownMenu
        environmentId="env123"
        survey={fakeSurvey}
        publicDomain="http://survey.test"
        refreshSingleUseId={vi.fn()}
        deleteSurvey={vi.fn()}
        disabled={false}
        isSurveyCreationDeletionDisabled={false}
      />
    );

    // Find the menu wrapper
    const menuWrapper = screen.getByTestId("survey-dropdown-menu");

    // Inside that wrapper, find the actual trigger (div, button, etc.)
    // By default, the trigger is the first clickable child
    const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
    expect(triggerElement).toBeInTheDocument();

    // Use userEvent to mimic real user interaction
    await userEvent.click(triggerElement);

    const editItem = screen.getByText("common.edit");
    const deleteItem = screen.getByText("common.delete");

    expect(editItem).toBeInTheDocument();
    expect(deleteItem).toBeInTheDocument();
  });

  const fakeSurvey = {
    id: "testSurvey",
    name: "Test Survey",
    status: "inProgress",
    type: "link",
    responseCount: 5,
  } as unknown as TSurvey;

  test("handleEditforActiveSurvey opens EditPublicSurveyAlertDialog for active surveys", async () => {
    render(
      <SurveyDropDownMenu
        environmentId="env123"
        survey={fakeSurvey}
        publicDomain="http://survey.test"
        refreshSingleUseId={vi.fn()}
        deleteSurvey={vi.fn()}
      />
    );

    const menuWrapper = screen.getByTestId("survey-dropdown-menu");
    const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
    expect(triggerElement).toBeInTheDocument();
    await userEvent.click(triggerElement);

    const editButton = screen.getByText("common.edit");
    await userEvent.click(editButton);

    expect(screen.getByText("environments.surveys.edit.caution_edit_published_survey")).toBeInTheDocument();
  });

  test("handleEditforActiveSurvey does not open caution dialog for surveys with 0 response count", async () => {
    render(
      <SurveyDropDownMenu
        environmentId="env123"
        survey={{ ...fakeSurvey, responseCount: 0 }}
        publicDomain="http://survey.test"
        refreshSingleUseId={vi.fn()}
        deleteSurvey={vi.fn()}
      />
    );

    const menuWrapper = screen.getByTestId("survey-dropdown-menu");
    const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
    expect(triggerElement).toBeInTheDocument();
    await userEvent.click(triggerElement);

    const editButton = screen.getByText("common.edit");
    await userEvent.click(editButton);

    expect(
      screen.queryByText("environments.surveys.edit.caution_edit_published_survey")
    ).not.toBeInTheDocument();
  });

  test("<DropdownMenuItem> renders and triggers actions correctly", async () => {
    render(
      <SurveyDropDownMenu
        environmentId="env123"
        survey={fakeSurvey}
        publicDomain="http://survey.test"
        refreshSingleUseId={vi.fn()}
        deleteSurvey={vi.fn()}
      />
    );

    const menuWrapper = screen.getByTestId("survey-dropdown-menu");
    const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
    expect(triggerElement).toBeInTheDocument();
    await userEvent.click(triggerElement);

    const duplicateButton = screen.getByText("common.duplicate");
    expect(duplicateButton).toBeInTheDocument();
    await userEvent.click(duplicateButton);
  });

  test("<EditPublicSurveyAlertDialog> displays and handles actions correctly", async () => {
    render(
      <SurveyDropDownMenu
        environmentId="env123"
        survey={{ ...fakeSurvey, responseCount: 5 }}
        publicDomain="http://survey.test"
        refreshSingleUseId={vi.fn()}
        deleteSurvey={vi.fn()}
      />
    );

    const menuWrapper = screen.getByTestId("survey-dropdown-menu");
    const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
    expect(triggerElement).toBeInTheDocument();
    await userEvent.click(triggerElement);

    const editButton = screen.getByText("common.edit");
    expect(editButton).toBeInTheDocument();
    await userEvent.click(editButton);

    // Test that the dialog is shown
    const dialogTitle = screen.getByText("environments.surveys.edit.caution_edit_published_survey");
    expect(dialogTitle).toBeInTheDocument();

    // Test that the dialog buttons work
    const editButtonInDialog = screen.getByRole("button", { name: "common.edit" });
    expect(editButtonInDialog).toBeInTheDocument();
    await userEvent.click(editButtonInDialog);

    const duplicateButton = screen.getByRole("button", { name: "common.duplicate" });
    expect(duplicateButton).toBeInTheDocument();
    await userEvent.click(duplicateButton);
  });

  describe("handleDeleteSurvey", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test("successfully deletes survey - calls all expected functions and shows success toast", async () => {
      const mockDeleteSurvey = vi.fn();
      mockDeleteSurveyAction.mockResolvedValueOnce({ data: true });

      render(
        <SurveyDropDownMenu
          environmentId="env123"
          survey={fakeSurvey}
          publicDomain="http://survey.test"
          refreshSingleUseId={vi.fn()}
          deleteSurvey={mockDeleteSurvey}
        />
      );

      // Open dropdown and click delete
      const menuWrapper = screen.getByTestId("survey-dropdown-menu");
      const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
      await userEvent.click(triggerElement);

      const deleteButton = screen.getByText("common.delete");
      await userEvent.click(deleteButton);

      // Confirm deletion in dialog
      const confirmDeleteButton = screen.getByText("common.delete");
      await userEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(mockDeleteSurveyAction).toHaveBeenCalledWith({ surveyId: "testSurvey" });
        expect(mockDeleteSurvey).toHaveBeenCalledWith("testSurvey");
        expect(mockToast.success).toHaveBeenCalledWith("environments.surveys.survey_deleted_successfully");
        expect(mockRouterRefresh).toHaveBeenCalled();
      });
    });

    test("handles deletion error - shows error toast and resets loading state", async () => {
      const mockDeleteSurvey = vi.fn();
      const deletionError = new Error("Deletion failed");
      mockDeleteSurveyAction.mockRejectedValueOnce(deletionError);

      render(
        <SurveyDropDownMenu
          environmentId="env123"
          survey={fakeSurvey}
          publicDomain="http://survey.test"
          refreshSingleUseId={vi.fn()}
          deleteSurvey={mockDeleteSurvey}
        />
      );

      // Open dropdown and click delete
      const menuWrapper = screen.getByTestId("survey-dropdown-menu");
      const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
      await userEvent.click(triggerElement);

      const deleteButton = screen.getByText("common.delete");
      await userEvent.click(deleteButton);

      // Confirm deletion in dialog
      const confirmDeleteButton = screen.getByText("common.delete");
      await userEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(mockDeleteSurveyAction).toHaveBeenCalledWith({ surveyId: "testSurvey" });
        expect(mockDeleteSurvey).not.toHaveBeenCalled();
        expect(mockToast.error).toHaveBeenCalledWith("environments.surveys.error_deleting_survey");
        expect(mockRouterRefresh).not.toHaveBeenCalled();
      });
    });

    test("manages loading state correctly during successful deletion", async () => {
      const mockDeleteSurvey = vi.fn();
      mockDeleteSurveyAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: true }), 100))
      );

      render(
        <SurveyDropDownMenu
          environmentId="env123"
          survey={fakeSurvey}
          publicDomain="http://survey.test"
          refreshSingleUseId={vi.fn()}
          deleteSurvey={mockDeleteSurvey}
        />
      );

      // Open dropdown and click delete
      const menuWrapper = screen.getByTestId("survey-dropdown-menu");
      const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
      await userEvent.click(triggerElement);

      const deleteButton = screen.getByText("common.delete");
      await userEvent.click(deleteButton);

      // Confirm deletion in dialog using a more reliable selector
      const confirmDeleteButton = screen.getByText("common.delete");
      await userEvent.click(confirmDeleteButton);

      // Wait for the deletion process to complete
      await waitFor(() => {
        expect(mockDeleteSurveyAction).toHaveBeenCalled();
        expect(mockDeleteSurvey).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalled();
      });
    });

    test("manages loading state correctly during failed deletion", async () => {
      const mockDeleteSurvey = vi.fn();
      mockDeleteSurveyAction.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error("Network error")), 100))
      );

      render(
        <SurveyDropDownMenu
          environmentId="env123"
          survey={fakeSurvey}
          publicDomain="http://survey.test"
          refreshSingleUseId={vi.fn()}
          deleteSurvey={mockDeleteSurvey}
        />
      );

      // Open dropdown and click delete
      const menuWrapper = screen.getByTestId("survey-dropdown-menu");
      const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
      await userEvent.click(triggerElement);

      const deleteButton = screen.getByText("common.delete");
      await userEvent.click(deleteButton);

      // Confirm deletion in dialog using a more reliable selector
      const confirmDeleteButton = screen.getByText("common.delete");
      await userEvent.click(confirmDeleteButton);

      // Wait for the error to occur
      await waitFor(() => {
        expect(mockDeleteSurveyAction).toHaveBeenCalled();
        expect(mockToast.error).toHaveBeenCalledWith("environments.surveys.error_deleting_survey");
      });

      // Verify that deleteSurvey callback was not called due to error
      expect(mockDeleteSurvey).not.toHaveBeenCalled();
      expect(mockRouterRefresh).not.toHaveBeenCalled();
    });

    test("does not call router.refresh or success toast when deleteSurveyAction throws", async () => {
      const mockDeleteSurvey = vi.fn();
      mockDeleteSurveyAction.mockRejectedValueOnce(new Error("API Error"));

      render(
        <SurveyDropDownMenu
          environmentId="env123"
          survey={fakeSurvey}
          publicDomain="http://survey.test"
          refreshSingleUseId={vi.fn()}
          deleteSurvey={mockDeleteSurvey}
        />
      );

      // Open dropdown and click delete
      const menuWrapper = screen.getByTestId("survey-dropdown-menu");
      const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
      await userEvent.click(triggerElement);

      const deleteButton = screen.getByText("common.delete");
      await userEvent.click(deleteButton);

      // Confirm deletion in dialog
      const confirmDeleteButton = screen.getByText("common.delete");
      await userEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(mockDeleteSurveyAction).toHaveBeenCalled();
        expect(mockToast.error).toHaveBeenCalled();
      });

      // Verify success-path functions are not called
      expect(mockDeleteSurvey).not.toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
      expect(mockRouterRefresh).not.toHaveBeenCalled();
    });

    test("calls functions in correct order during successful deletion", async () => {
      const mockDeleteSurvey = vi.fn();
      const callOrder: string[] = [];

      mockDeleteSurveyAction.mockImplementation(async () => {
        callOrder.push("deleteSurveyAction");
        return { data: true };
      });

      mockDeleteSurvey.mockImplementation(() => {
        callOrder.push("deleteSurvey");
      });

      (mockToast.success as any).mockImplementation(() => {
        callOrder.push("toast.success");
      });

      mockRouterRefresh.mockImplementation(() => {
        callOrder.push("router.refresh");
      });

      render(
        <SurveyDropDownMenu
          environmentId="env123"
          survey={fakeSurvey}
          publicDomain="http://survey.test"
          refreshSingleUseId={vi.fn()}
          deleteSurvey={mockDeleteSurvey}
        />
      );

      // Open dropdown and click delete
      const menuWrapper = screen.getByTestId("survey-dropdown-menu");
      const triggerElement = menuWrapper.querySelector("[class*='p-2']") as HTMLElement;
      await userEvent.click(triggerElement);

      const deleteButton = screen.getByText("common.delete");
      await userEvent.click(deleteButton);

      // Confirm deletion in dialog
      const confirmDeleteButton = screen.getByText("common.delete");
      await userEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(callOrder).toEqual(["deleteSurveyAction", "deleteSurvey", "toast.success", "router.refresh"]);
      });
    });
  });
});
