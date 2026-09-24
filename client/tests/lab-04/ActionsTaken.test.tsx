import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionsTakenSection } from "../../src/components/ActionsTakenSection";
import * as api from "../../src/api";

describe("UI-01 to UI-04: Actions Taken Component Tests (Lab 4)", () => {
  const mockStaffList: api.StaffMember[] = [
    {
      id: 6,
      name: "Supachai Techavichit",
      email: "staff.supachai@kmutt.ac.th",
      role: "STAFF",
      department: "IT Operations",
    },
    {
      id: 7,
      name: "Manee Kerdphon",
      email: "staff.manee@kmutt.ac.th",
      role: "STAFF",
      department: "IT Helpdesk",
    },
  ];

  const mockActions: api.ActionTaken[] = [
    {
      id: 1,
      ticketId: 101,
      actionDateTime: "2026-09-24T08:30:00.000Z",
      actionDescription: "Ran hardware diagnostic tests on battery cells.",
      result: "Cell 3 reported high internal impedance.",
      performedById: 6,
      performedBy: {
        id: 6,
        name: "Supachai Techavichit",
        role: "STAFF",
      },
      status: "COMPLETED",
      followUpRequired: true,
      followUpNote: "Ordered replacement battery pack model BTY-X1.",
      attachmentNotes: "diag_battery_01.log",
      createdAt: "2026-09-24T08:30:00.000Z",
      updatedAt: "2026-09-24T08:30:00.000Z",
    },
    {
      id: 2,
      ticketId: 101,
      actionDateTime: "2026-09-24T09:00:00.000Z",
      actionDescription: "Swapped lithium battery pack into chassis.",
      result: "Chassis reassembled and power delivery normal.",
      performedById: 7,
      performedBy: {
        id: 7,
        name: "Manee Kerdphon",
        role: "STAFF",
      },
      status: "IN_PROGRESS",
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
      createdAt: "2026-09-24T09:00:00.000Z",
      updatedAt: "2026-09-24T09:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("UI-01 (AC-01): Renders list of Actions Taken with Date, Performer, Description, and Result", () => {
    render(
      <ActionsTakenSection
        ticketId={101}
        actions={mockActions}
        isStaff={true}
        currentUserId={6}
        staffList={mockStaffList}
        onActionSaved={vi.fn()}
      />
    );

    expect(screen.getByText(/Actions Taken/i)).toBeInTheDocument();
    expect(screen.getByText("Ran hardware diagnostic tests on battery cells.")).toBeInTheDocument();
    expect(screen.getByText("Cell 3 reported high internal impedance.")).toBeInTheDocument();
    expect(screen.getByText("Supachai Techavichit")).toBeInTheDocument();
    expect(screen.getByText("Swapped lithium battery pack into chassis.")).toBeInTheDocument();
    expect(screen.getByText("Manee Kerdphon")).toBeInTheDocument();
    expect(screen.getByText("Ordered replacement battery pack model BTY-X1.")).toBeInTheDocument();
  });

  it("UI-02 (AC-02): Displays validation error when attempting to submit with follow-up required but no note", async () => {
    render(
      <ActionsTakenSection
        ticketId={101}
        actions={mockActions}
        isStaff={true}
        currentUserId={6}
        staffList={mockStaffList}
        onActionSaved={vi.fn()}
      />
    );

    // Click Record Action button
    fireEvent.click(screen.getByTestId("record-action-button"));

    // Fill in description and result
    fireEvent.change(screen.getByTestId("action-description-input"), {
      target: { value: "Inspected internal power rails with multimeter." },
    });
    fireEvent.change(screen.getByTestId("action-result-input"), {
      target: { value: "Voltage rail stable at 19.5V." },
    });

    // Check follow-up required
    fireEvent.click(screen.getByTestId("follow-up-checkbox"));

    // Attempt to submit without filling follow-up note
    fireEvent.click(screen.getByTestId("save-action-button"));

    await waitFor(() => {
      expect(screen.getByTestId("form-error")).toHaveTextContent(
        /follow-up note.*required/i
      );
    });
  });

  it("UI-03 (AC-04): Renders read-only Actions Taken on Requester view with create/edit buttons omitted", () => {
    render(
      <ActionsTakenSection
        ticketId={101}
        actions={mockActions}
        isStaff={false} // Requester view!
        onActionSaved={vi.fn()}
      />
    );

    // Verify actions are displayed
    expect(screen.getByText("Ran hardware diagnostic tests on battery cells.")).toBeInTheDocument();
    expect(screen.getByText("Swapped lithium battery pack into chassis.")).toBeInTheDocument();

    // Verify mutating controls are strictly omitted
    expect(screen.queryByTestId("record-action-button")).toBeNull();
    expect(screen.queryByTestId("edit-action-1")).toBeNull();
    expect(screen.queryByTestId("edit-action-2")).toBeNull();
    expect(screen.queryByRole("button", { name: /Complete/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Cancel/i })).toBeNull();
  });

  it("UI-04 (AC-05): Allows IT Staff to edit an existing action and change its status", async () => {
    const updateSpy = vi.spyOn(api, "updateActionTaken").mockResolvedValue({
      ...mockActions[1],
      status: "COMPLETED",
      result: "Battery pack verified fully charged and calibrated.",
    });

    const onSavedMock = vi.fn();

    render(
      <ActionsTakenSection
        ticketId={101}
        actions={mockActions}
        isStaff={true}
        currentUserId={6}
        staffList={mockStaffList}
        onActionSaved={onSavedMock}
      />
    );

    // Click Edit on action 2
    fireEvent.click(screen.getByTestId("edit-action-2"));

    expect(screen.getByText("✏️ Edit Action Taken")).toBeInTheDocument();

    // Modify result
    fireEvent.change(screen.getByTestId("action-result-input"), {
      target: { value: "Battery pack verified fully charged and calibrated." },
    });

    // Save changes
    fireEvent.click(screen.getByTestId("save-action-button"));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        101,
        2,
        expect.objectContaining({
          result: "Battery pack verified fully charged and calibrated.",
        })
      );
      expect(onSavedMock).toHaveBeenCalled();
    });
  });
});
