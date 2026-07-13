import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import App from "./App";

jest.mock("axios");

const bulbasaur = {
  id: 1,
  name: "bulbasaur",
  sprites: {
    front_default: "bulbasaur.png",
    front_shiny: "bulbasaur-shiny.png",
    other: {
      "official-artwork": { front_default: "bulbasaur-art.png" },
      dream_world: { front_default: null },
    },
  },
  cries: {
    latest: "bulbasaur-cry.ogg",
    legacy: "bulbasaur-legacy-cry.ogg",
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
  localStorage.clear();
  window.scrollTo = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
  window.Audio = jest.fn(() => ({
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    currentTime: 0,
    onended: null,
    onerror: null,
  }));

  axios.get.mockImplementation((url) => {
    if (url === "https://pokeapi.co/api/v2/type") {
      return Promise.resolve({
        data: { results: [{ name: "grass" }, { name: "fire" }] },
      });
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?limit=2000&offset=0") {
      return Promise.resolve({
        data: {
          results: [
            { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
            { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
            { name: "venusaur", url: "https://pokeapi.co/api/v2/pokemon/3/" },
          ],
        },
      });
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=0&limit=12") {
      return Promise.resolve(pageResponse);
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=24&limit=12") {
      return Promise.resolve(pageResponse);
    }

    if (url === "https://pokeapi.co/api/v2/pokemon?offset=0&limit=6") {
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
  expect(await screen.findByText(/showing page 1 of 4/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(document.querySelector(".grid-pokemon-name")).toHaveTextContent(/bulbasaur/i);
  });
  expect(screen.getByRole("img", { name: "bulbasaur" })).toHaveAttribute(
    "src",
    "bulbasaur-art.png"
  );
  expect(screen.getByRole("combobox", { name: /filter by type/i })).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: /cards per page/i })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /my teams/i })).toBeInTheDocument();
});

test("navigates with the page number buttons", async () => {
  render(<App />);

  await waitFor(() => {
    expect(document.querySelector(".grid-pokemon-name")).toHaveTextContent(/bulbasaur/i);
  });
  fireEvent.click(await screen.findByRole("button", { name: "3" }));

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?offset=24&limit=12"
    );
  });

  expect(await screen.findByText(/showing page 3 of 4/i)).toBeInTheDocument();
});

test("automatically changes the page size when the viewport gets smaller", async () => {
  render(<App />);

  await waitFor(() => {
    expect(document.querySelector(".grid-pokemon-name")).toHaveTextContent(/bulbasaur/i);
  });

  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1100 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 700 });
  fireEvent(window, new Event("resize"));

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon?offset=0&limit=6"
    );
  });

  expect(await screen.findByText(/showing page 1 of 8/i)).toBeInTheDocument();
});

test("closes the selected Pokémon detail without changing the grid", async () => {
  render(<App />);

  await waitFor(() => {
    expect(document.querySelector(".grid-pokemon-name")).toHaveTextContent(/bulbasaur/i);
  });

  fireEvent.click(document.querySelector(".pokemon-grid .card"));
  const closeButton = await screen.findByRole("button", { name: /close/i });
  fireEvent.click(closeButton);

  expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
  expect(screen.getByText(/click a pokémon to see details/i)).toBeInTheDocument();
});

test("pokemon details can play a cry and show the front shiny sprite", async () => {
  render(<App />);

  await waitFor(() => {
    expect(document.querySelector(".grid-pokemon-name")).toHaveTextContent(/bulbasaur/i);
  });
  fireEvent.click(document.querySelector(".pokemon-grid .card"));

  const detailPanel = await screen.findByRole("complementary", {
    name: /bulbasaur details/i,
  });
  expect(within(detailPanel).getByRole("img", { name: "bulbasaur" })).toHaveAttribute(
    "src",
    "bulbasaur.png"
  );

  fireEvent.click(
    await screen.findByRole("button", { name: /show front shiny for bulbasaur/i })
  );
  expect(screen.getByRole("img", { name: /bulbasaur shiny/i })).toHaveAttribute(
    "src",
    "bulbasaur-shiny.png"
  );

  fireEvent.click(screen.getByRole("button", { name: /play bulbasaur cry/i }));
  expect(window.Audio).toHaveBeenCalledWith("bulbasaur-cry.ogg");
  expect(screen.getByRole("button", { name: /stop bulbasaur cry/i })).toBeInTheDocument();
});

test("favorites are saved locally and can be removed from the header dropdown", async () => {
  render(<App />);

  await waitFor(() => {
    expect(document.querySelector(".grid-pokemon-name")).toHaveTextContent(/bulbasaur/i);
  });

  const addFavorite = await screen.findByRole("button", {
    name: /add bulbasaur to favorites/i,
  });
  expect(addFavorite).toHaveClass("card-favorite-button");
  fireEvent.click(addFavorite);

  fireEvent.click(screen.getByRole("button", { name: /favorites, 1 saved/i }));
  const favoritesDropdown = document.querySelector(".header-favorites-dropdown");
  expect(
    within(favoritesDropdown).getByRole("button", { name: /view bulbasaur/i })
  ).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("pokedex-favorites:v1"))).toEqual([
    expect.objectContaining({ id: 1, name: "bulbasaur" }),
  ]);

  fireEvent.click(
    within(favoritesDropdown).getByRole("button", {
      name: /remove bulbasaur from favorites/i,
    })
  );

  expect(screen.getByText(/use a heart to add a pokémon/i)).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("pokedex-favorites:v1"))).toEqual([]);
});

test("team slots support direct removal and persist their shiny selection", async () => {
  localStorage.setItem(
    "pokedex-teams",
    JSON.stringify([
      {
        id: "shiny-team",
        name: "Shiny Team",
        pokemon: [
          {
            id: 1,
            name: "bulbasaur",
            sprite: "bulbasaur.png",
            shinySprite: "bulbasaur-shiny.png",
            types: ["grass"],
          },
          null,
          null,
          null,
          null,
          null,
        ],
      },
    ])
  );

  render(<App />);

  const teamsPage = document.querySelector(".teams-page");
  const shinyButton = within(teamsPage).getByRole("button", {
    name: /show shiny bulbasaur/i,
  });
  fireEvent.click(shinyButton);

  expect(within(teamsPage).getByRole("img", { name: /bulbasaur shiny/i })).toHaveAttribute(
    "src",
    "bulbasaur-shiny.png"
  );
  expect(JSON.parse(localStorage.getItem("pokedex-teams"))[0].pokemon[0].isShiny).toBe(true);

  expect(
    within(teamsPage).queryByRole("button", {
      name: /remove bulbasaur from team/i,
    })
  ).not.toBeInTheDocument();
  fireEvent.click(teamsPage.querySelector(".team-slot--filled"));

  fireEvent.click(
    within(teamsPage).getByRole("button", {
      name: /remove bulbasaur from team/i,
    })
  );

  expect(within(teamsPage).queryByRole("img", { name: /bulbasaur/i })).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("pokedex-teams"))[0].pokemon[0]).toBeNull();
});

test("trainer dashboard shows live Pokédex and team stats and scrolls to a section on click", async () => {
  render(<App />);

  expect(await screen.findByText(/3 species indexed/i)).toBeInTheDocument();
  expect(
    await screen.findByText(/no teams yet — start building/i)
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: /go to my teams section/i })
  );

  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});

test("trainer dashboard sightings let you jump to a Pokémon", async () => {
  render(<App />);

  const tiles = await screen.findAllByRole("button", { name: /view bulbasaur/i });
  fireEvent.click(tiles[0]);

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      "https://pokeapi.co/api/v2/pokemon/bulbasaur"
    );
  });
});

test("today's encounter stays stable and scouting it completes the objective", async () => {
  const firstRender = render(<App />);
  await screen.findByText(/3 species indexed/i);
  const silhouette = screen.getByRole("img", { name: /mystery pokémon silhouette/i });
  const encounterId = silhouette.src.match(/\/(\d+)\.png$/)[1];
  const encounterName = {
    1: "bulbasaur",
    2: "ivysaur",
    3: "venusaur",
  }[encounterId];

  fireEvent.change(await screen.findByRole("textbox", { name: /guess today's mystery pokémon/i }), {
    target: { value: encounterName },
  });
  fireEvent.click(screen.getByRole("button", { name: /check pokémon answer/i }));
  expect(
    await screen.findByRole("button", { name: new RegExp(`view ${encounterName} in pokédex`, "i") })
  ).toBeInTheDocument();
  expect(document.querySelector(".encounter-guess-search")).toHaveClass("is-correct");
  expect(document.querySelector(".encounter-guess-feedback")).toHaveClass("is-success");

  firstRender.unmount();
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: new RegExp(encounterName, "i") })
  ).toBeInTheDocument();
  expect(
    await screen.findByRole("button", { name: new RegExp(`view ${encounterName} in pokédex`, "i") })
  ).toBeInTheDocument();
});

test("the mystery encounter keeps an incorrect recommendation visible", async () => {
  render(<App />);
  await screen.findByText(/3 species indexed/i);
  const guessInput = await screen.findByRole("textbox", {
    name: /guess today's mystery pokémon/i,
  });
  const encounterId = screen
    .getByRole("img", { name: /mystery pokémon silhouette/i })
    .src.match(/\/(\d+)\.png$/)[1];
  const wrongName = encounterId === "1" ? "ivysaur" : "bulbasaur";

  fireEvent.change(guessInput, { target: { value: wrongName.slice(0, 4) } });
  expect(guessInput).toHaveAttribute("autocomplete", "off");
  await waitFor(() => {
    expect(document.querySelector(".encounter-guess-search .autocomplete-item")).toHaveTextContent(
      new RegExp(wrongName, "i")
    );
  });
  fireEvent.mouseDown(document.querySelector(".encounter-guess-search .autocomplete-item"));

  expect(await screen.findByText(/not quite — try another species/i)).toBeInTheDocument();
  expect(guessInput).toHaveValue(
    wrongName.charAt(0).toUpperCase() + wrongName.slice(1)
  );
  expect(document.querySelector(".encounter-guess-search")).toHaveClass("is-wrong", "is-shaking");
  expect(screen.getByRole("heading", { name: /mystery species/i })).toBeInTheDocument();
});

test("legacy scouting progress does not reveal the mystery challenge", async () => {
  const date = new Date();
  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  [1, 2, 3].forEach((id) => {
    localStorage.setItem(`pokedex-field-scout:${dateKey}:${id}`, "complete");
  });

  render(<App />);

  expect(await screen.findByRole("img", { name: /mystery pokémon silhouette/i })).toHaveClass(
    "encounter-pokemon--hidden"
  );
  expect(
    await screen.findByRole("textbox", { name: /guess today's mystery pokémon/i })
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /view .* in pokédex/i })).not.toBeInTheDocument();
});

test("field research explains expedition preparation and links to teams", async () => {
  render(<App />);

  expect(await screen.findByText(/fill all 6 slots in one team · 0\/6 ready/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /prepare an expedition team/i }));

  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});

test("the empty teams state uses the compact three-team emblem", () => {
  render(<App />);

  expect(screen.getByRole("img", { name: /three team emblems/i })).toBeInTheDocument();
  expect(document.querySelector(".teams-empty-icon svg")).not.toBeInTheDocument();
});

test("field research completes expedition preparation for a full saved team", async () => {
  localStorage.setItem(
    "pokedex-teams",
    JSON.stringify([
      {
        id: "ready-team",
        name: "Field Team",
        pokemon: Array.from({ length: 6 }, (_, index) => ({
          id: index + 1,
          name: `partner-${index + 1}`,
          sprite: "partner.png",
          types: ["normal"],
        })),
      },
    ])
  );

  render(<App />);

  expect(await screen.findByText(/a six-partner team is ready/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /prepare an expedition team/i })).toHaveClass(
    "research-task--complete"
  );
});
