import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders CodeShare home page header and join button", () => {
  render(<App />);
  const headingElement = screen.getByText(/Welcome to CodeShare/i);
  expect(headingElement).toBeInTheDocument();

  const buttonElement = screen.getByRole("button", { name: /Join Room/i });
  expect(buttonElement).toBeInTheDocument();
});
