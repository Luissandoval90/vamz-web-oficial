// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkStudioUI(page) {
  const assert = {
    equal(actual, expected, message) {
      if (actual !== expected)
        throw Error(message || `${actual} !== ${expected}`);
    },
    notEqual(actual, expected, message) {
      if (actual === expected)
        throw Error(message || "Expected a different value");
    },
    ok(value, message) {
      if (!value) throw Error(message || "Assertion failed");
    },
  };
  const base = new URL(page.url()).origin;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base);
  const carousel = page.getByRole("region", {
    name: "Recursos destacados",
    exact: true,
  });
  await carousel.waitFor();
  await carousel
    .getByRole("button", { name: "Pausar carrusel", exact: true })
    .click();
  assert.equal(
    await carousel
      .getByRole("button", { name: "Reproducir carrusel", exact: true })
      .count(),
    1,
    "La pausa debe mantenerse después de recibir foco",
  );
  const tabs = carousel
    .getByRole("group", { name: "Elegir recurso destacado" })
    .getByRole("button");
  const first = (await tabs.first().getAttribute("aria-label")).replace(
    "Mostrar ",
    "",
  );
  const last = (await tabs.last().getAttribute("aria-label")).replace(
    "Mostrar ",
    "",
  );
  await tabs.first().click();
  assert.equal(
    await carousel.getByRole("heading", { level: 1 }).innerText(),
    first,
  );
  const firstLink = await carousel
    .getByRole("link", { name: "Ver recurso", exact: true })
    .getAttribute("href");
  await carousel
    .getByRole("button", { name: "Recurso anterior", exact: true })
    .click();
  assert.equal(
    await carousel.getByRole("heading", { level: 1 }).innerText(),
    last,
    "Anterior desde el primero debe mostrar el último",
  );
  assert.notEqual(
    await carousel
      .getByRole("link", { name: "Ver recurso", exact: true })
      .getAttribute("href"),
    firstLink,
    "La descarga debe corresponder a la diapositiva seleccionada",
  );
  await carousel
    .getByRole("button", { name: "Recurso siguiente", exact: true })
    .click();
  assert.equal(
    await carousel.getByRole("heading", { level: 1 }).innerText(),
    first,
    "Siguiente desde el último debe volver al primero",
  );
  await carousel
    .getByRole("button", { name: "Recurso siguiente", exact: true })
    .press("ArrowLeft");
  assert.equal(
    await carousel.getByRole("heading", { level: 1 }).innerText(),
    last,
    "Las flechas del teclado deben navegar",
  );
  await carousel
    .getByRole("button", { name: "Reproducir carrusel", exact: true })
    .click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(7300);
  assert.notEqual(
    await carousel.getByRole("heading", { level: 1 }).innerText(),
    last,
    "La reproducción debe avanzar al salir del carrusel",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const still = await carousel.getByRole("heading", { level: 1 }).innerText();
  await page.waitForTimeout(7300);
  assert.equal(
    await carousel.getByRole("heading", { level: 1 }).innerText(),
    still,
    "Movimiento reducido debe detener la reproducción",
  );
  assert.equal(
    await carousel.getByRole("button", { name: /carrusel/ }).count(),
    0,
  );
  await page.getByRole("button", { name: "Más recursos", exact: true }).click();
  assert.ok(
    await page
      .getByRole("region", { name: "Recursos para descubrir", exact: true })
      .evaluate((element) => element.scrollLeft > 0),
    "La tira de recursos debe desplazarse",
  );
  await page
    .getByText("¿Necesito una cuenta para descargar?", { exact: true })
    .click();
  assert.equal(
    await page
      .getByText(
        "Puedes explorar y descargar los recursos publicados sin registrarte.",
        { exact: false },
      )
      .isVisible(),
    true,
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "Sin desbordamiento horizontal a " + width,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  assert.equal(
    await page
      .getByRole("navigation", { name: "Navegación principal" })
      .isVisible(),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("navigation", { name: "Navegación principal" })
      .isVisible(),
    false,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Abrir menú", exact: true })
      .evaluate((element) => document.activeElement === element),
    true,
  );
  await page.goto(base + "/recursos?type=images");
  assert.equal(
    await page
      .getByRole("button", { name: "Imágenes", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.goto(base + "/recursos?q=Spectral&type=packs");
  assert.equal(
    await page.getByRole("article").count(),
    1,
    "La búsqueda debe combinarse con el tipo de archivo",
  );
  assert.ok((await page.getByRole("article").innerText()).includes("Spectral"));
  console.log(
    "Carrusel, pausa, enlaces, teclado, reproducción, movimiento reducido, tira, ayuda, menú móvil y filtros verificados.",
  );
}
