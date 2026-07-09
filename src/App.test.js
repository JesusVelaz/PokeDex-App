import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import App from "./App";

jest.mock("axios");

const bulbasaur = {
  id: 1,
  name: "bulbasaur",
  sprites: {
    front_default: "bulbasaur.png",
    other: {
      "official-artwork": { front_default: "bulbasaur-art.png" },
      dream_world: { front_default: null },
    },
  },
  abilities: [{ ability: { name: "overgrow" } }],
  stats: [{ stat: { name: "hp" }, base_stat: 45 }],
  height: 7,
  weight: 69,
  types: [{ type: { name: "grass" } }],
};

const pageResponse = {
  data: {
    count: 45,
    results: [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }],
  },
};

beforeEach(() => {
  window.scrollTo = jest.fn();

  axios.get.mockImplementation((url) => {
    if (url === "https://pokeapi.co/api/v2/type") {
      return Promise.resolve({
        data: { results: [{ name: "grass" }, { name: "fire" }] },
      });
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=0&limit=10") {
      return Promise.resolve(pageResponse);
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=20&limit=10") {
      return Promise.resolve(pageResponse);
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=0&limit=50") {
      return Promise.resolve(pageResponse);
    }

    if (
      url === "https://pokeapi.co/api/v2/pokemon/1/" ||
      url === "https://pokeapi.co/api/v2/pokemon/bulbasaur"
    ) {
      return Promise.resolve({ data: bulbasaur });
    }

    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("renders search, pokémon grid, filters, and teams section on one page", async () => {
  render(<App />);

  expect(screen.getByPlaceholderText(/search pokémon/i)).toBeInTheDocument();
  expect(await screen.findByText(/showing page 1 of 5/i)).toBeInTheDocument();
  expect(await screen.findByText(/bulbasaur/i)).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /filter by type/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /cards per page/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /my teams/i })).toBeInTheDocument();
});

test("navigates with the page number buttons", async () => {
  render(<App />);

  await screen.findByText(/bulbasaur/i);
  fireEvent.click(await screen.findByRole("button", { name: "3" }));

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?offset=20&limit=10"
    );
  });

  expect(await screen.findByText(/showing page 3 of 5/i)).toBeInTheDocument();
});

test("changes the cards per page selector", async () => {
  render(<App />);

  const pageSizeSelect = await screen.findByRole("combobox", { name: /cards per page/i });
  await screen.findByText(/bulbasaur/i);

  fireEvent.change(pageSizeSelect, { target: { value: "50" } });

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?offset=0&limit=50"
    );
  });

  expect(await screen.findByText(/showing page 1 of 1/i)).toBeInTheDocument();
});
