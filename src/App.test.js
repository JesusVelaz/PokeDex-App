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

beforeEach(() => {
  window.scrollTo = jest.fn();

  axios.get.mockImplementation((url) => {
    if (url === "https://pokeapi.co/api/v2/type") {
      return Promise.resolve({
        data: {
          results: [{ name: "grass" }, { name: "fire" }],
        },
      });
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=0&limit=25") {
      return Promise.resolve({
        data: {
          count: 45,
          results: [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }],
        },
      });
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=25&limit=25") {
      return Promise.resolve({
        data: {
          count: 45,
          results: [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }],
        },
      });
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=0&limit=50") {
      return Promise.resolve({
        data: {
          count: 45,
          results: [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }],
        },
      });
    }

    if (
      url === "https://pokeapi.co/api/v2/pokemon/1/" ||
      url === "https://pokeapi.co/api/v2/pokemon/bulbasaur"
    ) {
      return Promise.resolve({ data: bulbasaur });
    }

    if (url === "https://pokeapi.co/api/v2/type/grass") {
      return Promise.resolve({
        data: {
          pokemon: [{ pokemon: { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" } }],
        },
      });
    }

    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test("renders search input and type filter", async () => {
  render(<App />);

  expect(screen.getByPlaceholderText(/search pokémon/i)).toBeInTheDocument();
  expect(await screen.findByText(/showing page 1 of 2/i)).toBeInTheDocument();
  expect(await screen.findByText(/bulbasaur/i)).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /filter by type/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /cards per page/i })).toBeInTheDocument();
  expect(screen.getByRole("spinbutton", { name: /go to page/i })).toBeInTheDocument();
});

test("jumps to a specific page from the page input", async () => {
  render(<App />);

  const pageInput = await screen.findByRole("spinbutton", { name: /go to page/i });
  await screen.findByText(/bulbasaur/i);
  fireEvent.change(pageInput, { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: /^go$/i }));

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?offset=25&limit=25"
    );
  });

  expect(await screen.findByText(/showing page 2 of 2/i)).toBeInTheDocument();
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
