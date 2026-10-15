const svgNamespace = "http://www.w3.org/2000/svg";
const numberFormat = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 0,
});
const percentFormat = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});
const offeredPrice = 700000;
const offeredArea = 1224;
const storageKey = "damroki-documents-v1";
const groups = [
  {
    ids: ["768/136", "768/137"],
    label: "Oferta",
    detail: "1224 m² według ogłoszenia · 700 000 zł za pakiet · 572 zł/m²",
  },
  {
    ids: ["1392", "1393"],
    label: "1392 + 1393",
    detail: "02.2025 · 860 m² łącznie · 540 400 zł · 628 zł/m² · prawdopodobny pakiet",
    offset: [-30, -25],
  },
  {
    ids: ["1401", "1402"],
    label: "1401 + 1402",
    detail: "10.2025 · 976 m² łącznie · 690 400 zł · 707 zł/m² · prawdopodobny pakiet",
    offset: [35, 32],
  },
  {
    ids: ["734/19"],
    label: "734/19",
    offset: [15, 25],
    detail: "05.2026 · 1092 m² · 445 000 zł · 408 zł/m² · ok. 660 m",
  },
  {
    ids: ["771/83", "771/103"],
    label: "771/83 i 771/103",
    detail: "06.2025 · dwa wpisy: 380 m² / 219 653 zł oraz 312 m² / 180 347 zł · oba 578 zł/m²",
  },
  {
    ids: ["733/119"],
    label: "733/119",
    detail: "04.2025 · 1194 m² · 485 000 zł · 406 zł/m² · ok. 855 m",
  },
];
let parcels = [];
let mapMode = "plots";
let selectedGroup = 0;

function element(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: ${id}`);
  return node;
}

function svgNode(tag, attributes = {}, content = "") {
  const node = document.createElementNS(svgNamespace, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (content) node.textContent = content;
  return node;
}

function projection(rings, width, height, padding) {
  const points = rings.flat().map(([lon, lat]) => [lon * Math.cos((54.4266 * Math.PI) / 180), -lat]);
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));
  const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY));
  const left = (width - (maxX - minX) * scale) / 2;
  const top = (height - (maxY - minY) * scale) / 2;
  return ([lon, lat]) => [
    left + (lon * Math.cos((54.4266 * Math.PI) / 180) - minX) * scale,
    top + (-lat - minY) * scale,
  ];
}

function drawPolygon(svg, parcel, project, className) {
  const points = parcel.ring.map((point) => project(point).join(",")).join(" ");
  const polygon = svgNode("polygon", { points, class: className });
  polygon.append(svgNode("title", {}, parcel.id));
  svg.append(polygon);
}

function drawParcelLabel(svg, parcel, project, size) {
  const [x, y] = project(parcel.center);
  const isFront = parcel.id === "768/136";
  svg.append(
    svgNode(
      "text",
      {
        x,
        y: y - 3,
        class: `svg-label${isFront ? " light" : ""}`,
        "font-size": size,
        "font-weight": 600,
      },
      parcel.id,
    ),
  );
  svg.append(
    svgNode(
      "text",
      {
        x,
        y: y + 17,
        class: `svg-label${isFront ? " light" : ""}`,
        "font-size": size - 3,
      },
      isFront ? "616 m²*" : "608 m²*",
    ),
  );
}

function drawScale(svg, project, width, height, meters) {
  const origin = [18.4447, 54.4266];
  const start = project(origin);
  const end = project([origin[0] + meters / (111320 * Math.cos((origin[1] * Math.PI) / 180)), origin[1]]);
  const length = end[0] - start[0];
  const x = width - length - 20;
  const y = height - 25;
  svg.append(
    svgNode("path", {
      d: `M ${x} ${y - 4} V ${y} H ${x + length} V ${y - 4}`,
      stroke: "var(--muted)",
      fill: "none",
    }),
  );
  svg.append(svgNode("text", { x: x + length / 2, y: y - 8, class: "svg-label", "font-size": 10 }, `~${meters} m`));
}

function drawHero() {
  const svg = element("hero-parcels");
  const selected = parcels.filter((parcel) => groups[0].ids.includes(parcel.id));
  const width = Math.max(260, svg.getBoundingClientRect().width);
  const height = Math.min(350, width * 0.84);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.replaceChildren(svgNode("title", {}, "Rzeczywiste granice działek, północ u góry"));
  const project = projection(
    selected.map((parcel) => parcel.ring),
    width,
    height,
    45,
  );
  const road = parcels.find((parcel) => parcel.id === "768/33");
  if (road) drawPolygon(svg, road, project, "road-shape");
  selected.forEach((parcel, index) => {
    drawPolygon(svg, parcel, project, `map-shape ${index === 0 ? "primary-shape" : "secondary-shape"}`);
    drawParcelLabel(svg, parcel, project, width < 330 ? 12 : 15);
  });
  svg.append(
    svgNode(
      "text",
      {
        x: 18,
        y: height - 20,
        class: "svg-label",
        "text-anchor": "start",
        "font-size": 10,
      },
      "DAMROKI",
    ),
  );
  svg.append(svgNode("text", { x: width - 16, y: 28, class: "svg-label", "font-size": 12 }, "N ↑"));
}

function groupCenter(group) {
  const centers = parcels.filter((parcel) => group.ids.includes(parcel.id)).map((parcel) => parcel.center);
  return [
    centers.reduce((sum, point) => sum + point[0], 0) / centers.length,
    centers.reduce((sum, point) => sum + point[1], 0) / centers.length,
  ];
}

function drawMarker(svg, group, index, project, width) {
  const [x, y] = project(groupCenter(group));
  const marker = svgNode("circle", {
    cx: x,
    cy: y,
    r: index === 0 ? 10 : 7,
    class: `map-pin${index === selectedGroup ? " selected-pin" : ""}`,
    tabindex: 0,
    role: "button",
    "aria-label": `${group.label}: ${group.detail}`,
    "aria-pressed": String(index === selectedGroup),
    "data-group": index,
  });
  marker.addEventListener("click", () => selectGroup(index));
  marker.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectGroup(index);
    }
  });
  marker.append(svgNode("title", {}, `${group.label} — ${group.detail}`));
  svg.append(marker);
  const [dx, dy] = group.offset || [0, -17];
  const labelX = Math.max(62, Math.min(width - 62, x + dx));
  if (dx)
    svg.append(
      svgNode("line", {
        x1: x,
        y1: y,
        x2: labelX,
        y2: y + dy + 3,
        stroke: "var(--muted)",
        "stroke-width": 1,
      }),
    );
  svg.append(
    svgNode(
      "text",
      {
        x: labelX,
        y: y + dy,
        class: "svg-label",
        "font-size": width < 500 ? 9 : 12,
      },
      group.label,
    ),
  );
}

function drawMap() {
  const svg = element("property-map");
  const focusedGroup = svg.contains(document.activeElement) ? document.activeElement.getAttribute("data-group") : null;
  const width = Math.max(280, svg.getBoundingClientRect().width);
  const height = width < 600 ? 350 : 500;
  const selected = parcels.filter((parcel) => groups[0].ids.includes(parcel.id));
  const visible = mapMode === "plots" ? selected : parcels.filter((parcel) => parcel.id !== "768/33");
  const project = projection(
    visible.map((parcel) => parcel.ring),
    width,
    height,
    width < 500 ? 60 : 85,
  );
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.replaceChildren(svgNode("title", {}, "Mapa porównawcza, geometria GUGiK"));
  const road = parcels.find((parcel) => parcel.id === "768/33");
  if (road) drawPolygon(svg, road, project, "road-shape");
  visible.forEach((parcel) => {
    const index = groups[0].ids.indexOf(parcel.id);
    drawPolygon(svg, parcel, project, `map-shape ${index === 0 ? "primary-shape" : "secondary-shape"}`);
    if (mapMode === "plots") drawParcelLabel(svg, parcel, project, width < 500 ? 13 : 18);
  });
  if (mapMode === "area")
    groups.forEach((group, index) => {
      drawMarker(svg, group, index, project, width);
    });
  drawScale(svg, project, width, height, mapMode === "plots" ? 10 : 200);
  if (focusedGroup !== null) svg.querySelector(`[data-group="${focusedGroup}"]`)?.focus();
  element("map-status").textContent =
    mapMode === "plots"
      ? "* Powierzchnie według opisu oferty. Droga: geometria 768/33."
      : "Wybierz punkt, aby zobaczyć szczegóły porównania.";
}

function updateMapButtons() {
  for (const [id, mode] of [
    ["view-plots", "plots"],
    ["view-area", "area"],
  ]) {
    element(id).setAttribute("aria-pressed", String(mapMode === mode));
    element(id).classList.toggle("selected", mapMode === mode);
  }
  element("map-picks")
    .querySelectorAll("button")
    .forEach((button, index) => {
      button.setAttribute("aria-pressed", String(index === selectedGroup));
    });
}

function selectGroup(index) {
  selectedGroup = index;
  if (index !== 0) mapMode = "area";
  const group = groups[index];
  const heading = document.createElement("strong");
  heading.textContent = group.ids.join(" + ");
  const detail = document.createElement("span");
  detail.textContent = group.detail;
  element("map-detail").replaceChildren(heading, detail);
  updateMapButtons();
  drawMap();
}

function setupMapControls() {
  groups.forEach((group, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = group.label;
    button.addEventListener("click", () => selectGroup(index));
    element("map-picks").append(button);
  });
  element("view-plots").addEventListener("click", () => {
    mapMode = "plots";
    selectGroup(0);
  });
  element("view-area").addEventListener("click", () => {
    mapMode = "area";
    updateMapButtons();
    drawMap();
  });
  updateMapButtons();
}

function validParcel(parcel) {
  const validPoint = (point) =>
    Array.isArray(point) &&
    point.length === 2 &&
    point.every(Number.isFinite) &&
    point[0] > 18 &&
    point[0] < 19 &&
    point[1] > 54 &&
    point[1] < 55;
  return (
    parcel &&
    typeof parcel.id === "string" &&
    Array.isArray(parcel.ring) &&
    parcel.ring.length >= 4 &&
    parcel.ring.every(validPoint) &&
    validPoint(parcel.center)
  );
}

async function loadMap() {
  try {
    const response = await fetch("assets/parcels.json");
    if (!response.ok) throw new Error("Map data unavailable");
    const data = await response.json();
    const requiredIds = [...groups.flatMap((group) => group.ids), "768/33"];
    if (!Array.isArray(data.parcels) || !data.parcels.every(validParcel)) throw new Error("Invalid map geometry");
    parcels = data.parcels;
    if (!requiredIds.every((id) => parcels.some((parcel) => parcel.id === id)))
      throw new Error("Incomplete map geometry");
    setupMapControls();
    drawHero();
    drawMap();
    new ResizeObserver(() => {
      drawHero();
      drawMap();
    }).observe(element("hero-parcels").parentElement);
  } catch {
    element("map-status").textContent =
      "Nie udało się wczytać mapy. Skorzystaj z odnośnika do mapy ulicznej lub geoportalu w źródłach.";
    element("hero-note").textContent = "768/136 · 616 m² oraz 768/137 · 608 m² według oferty";
    element("view-plots").disabled = true;
    element("view-area").disabled = true;
  }
}

function updatePrice() {
  const price = Number(element("price-range").value);
  const difference = offeredPrice - price;
  element("price-output").textContent = `${numberFormat.format(price)} zł`;
  element("unit-output").textContent = `${numberFormat.format(price / offeredArea)} zł/m²`;
  element("discount-label").textContent = difference >= 0 ? "PONIŻEJ OFERTY" : "POWYŻEJ OFERTY";
  element("discount-output").textContent =
    `${numberFormat.format(Math.abs(difference))} zł · ${percentFormat.format((Math.abs(difference) / offeredPrice) * 100)}%`;
}

function updateChecklist(save) {
  const checked = Array.from(document.querySelectorAll('input[name="document"]:checked'), (input) => input.value);
  element("check-progress").textContent = `${checked.length} z 5 sprawdzonych`;
  element("check-meter").value = checked.length;
  if (!save) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(checked));
  } catch {
    element("check-progress").textContent += " · zapis w przeglądarce niedostępny";
  }
}

function setupChecklist() {
  let saved = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(parsed)) saved = parsed;
  } catch {
    saved = [];
  }
  document.querySelectorAll('input[name="document"]').forEach((input) => {
    input.checked = saved.includes(input.value);
    input.addEventListener("change", () => updateChecklist(true));
  });
  updateChecklist(false);
}

function setupNavigation() {
  const links = document.querySelectorAll(".section-nav a");
  const observer = new IntersectionObserver(
    (entries) => {
      const active = entries.find((entry) => entry.isIntersecting);
      if (!active) return;
      links.forEach((link) => {
        const current = link.getAttribute("href") === `#${active.target.id}`;
        link.classList.toggle("active", current);
        if (current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-15% 0px -65% 0px" },
  );
  document.querySelectorAll("main > section[id]").forEach((section) => {
    observer.observe(section);
  });
}

element("price-range").addEventListener("input", updatePrice);
element("print-report").addEventListener("click", () => window.print());
const previouslyOpen = new Set();
window.addEventListener("beforeprint", () => {
  document.querySelectorAll("details").forEach((detail) => {
    if (detail.open) previouslyOpen.add(detail);
    detail.open = true;
  });
});
window.addEventListener("afterprint", () => {
  document.querySelectorAll("details").forEach((detail) => {
    detail.open = previouslyOpen.has(detail);
  });
  previouslyOpen.clear();
});
updatePrice();
setupChecklist();
setupNavigation();
loadMap();
