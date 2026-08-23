import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RequesterProvider, useRequester } from "../../src/context/RequesterContext";

const TestConsumer: React.FC = () => {
  const { currentRequester, setRequester, clearRequester } = useRequester();

  return (
    <div>
      <div data-testid="current-user">
        {currentRequester ? currentRequester.name : "None"}
      </div>
      <button
        onClick={() =>
          setRequester({
            id: 1,
            name: "Somchai Prasert",
            email: "somchai.pra@kmutt.ac.th",
            isActive: true,
          })
        }
      >
        Set User
      </button>
      <button onClick={clearRequester}>Clear User</button>
    </div>
  );
};

describe("UI-04: Requester Context Management", () => {
  it("allows setting and clearing active requester identity", () => {
    render(
      <RequesterProvider>
        <TestConsumer />
      </RequesterProvider>
    );

    expect(screen.getByTestId("current-user").textContent).toBe("None");

    fireEvent.click(screen.getByText("Set User"));
    expect(screen.getByTestId("current-user").textContent).toBe("Somchai Prasert");

    fireEvent.click(screen.getByText("Clear User"));
    expect(screen.getByTestId("current-user").textContent).toBe("None");
  });
});
