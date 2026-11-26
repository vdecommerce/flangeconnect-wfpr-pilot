(() => {
  const lessons = [...document.querySelectorAll("[data-lesson]")];
  const links = [...document.querySelectorAll("[data-lesson-link]")];
  const outlineLinks = [...document.querySelectorAll(".lesson-link")];
  const course = document.querySelector("#cursus");
  const progress = document.querySelector("[data-progress]");
  const progressText = document.querySelector("[data-progress-text]");
  const bars = [...document.querySelectorAll(".progress-bars i")];
  const storageKey = "flangeconnect-wfpr-pilot-completed-v1";
  const lessonIds = new Set(lessons.map(lesson => lesson.id));
  let completed = new Set();
  let activeId;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(stored)) completed = new Set(stored.filter(id => lessonIds.has(id)));
  } catch {
    // The lesson still works if the browser blocks local storage.
  }

  function updateProgress() {
    progressText.textContent = completed.size + " van " + lessons.length + " afgerond";
    bars.forEach((bar, index) => { bar.classList.toggle("complete", index < completed.size); });
    for (const link of outlineLinks) {
      const done = completed.has(link.dataset.lessonLink);
      const status = link.querySelector(".lesson-status");
      status.textContent = done ? "✓" : "›";
      status.classList.toggle("done", done);
      const label = link.querySelector("strong").textContent;
      if (done) link.setAttribute("aria-label", label + ", afgerond");
      else link.removeAttribute("aria-label");
    }
  }

  function show(id, moveFocus = false) {
    if (!lessonIds.has(id)) id = lessons[0].id;
    if (activeId !== id) {
      for (const lesson of lessons) {
        const visible = lesson.id === id;
        if (!visible) {
          const video = lesson.querySelector("video");
          if (!video.paused) video.pause();
        }
        lesson.hidden = !visible;
        lesson.classList.toggle("entering", visible);
      }
      activeId = id;
      for (const link of outlineLinks) {
        if (link.dataset.lessonLink === id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }
    if (moveFocus) {
      document.getElementById(id + "-title").focus({ preventScroll: true });
      course.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }

  for (const link of links) link.addEventListener("click", event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const id = link.dataset.lessonLink;
    if (location.hash !== "#" + id) history.pushState(null, "", "#" + id);
    show(id, true);
  });

  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
  const overview = document.querySelector("[data-overview]");
  overview.addEventListener("click", event => {
    event.preventDefault();
    document.querySelector("#outline-title").focus({ preventScroll: true });
    document.querySelector("#lesoverzicht").scrollIntoView({ block: "start" });
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  for (const lesson of lessons) {
    const form = lesson.querySelector(".quiz");
    const player = lesson.querySelector(".player");
    const video = player.querySelector("video");
    const feedback = lesson.querySelector(".feedback");
    const takeaway = lesson.querySelector(".takeaway");
    let correct;

    form.hidden = false;
    form.addEventListener("submit", event => {
      event.preventDefault();
      const picked = form.querySelector("input:checked");
      if (!picked) return;
      correct = picked.value === form.dataset.correct;
      feedback.textContent = "";
      delete feedback.dataset.result;
      takeaway.hidden = true;
      player.hidden = false;
      video.currentTime = 0;
      video.play().catch(() => { /* The viewer can use the video controls. */ });
      video.focus({ preventScroll: true });
      player.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "instant" : "smooth" });
    });
    video.addEventListener("play", () => {
      if (lesson.hidden) video.pause();
    });
    video.addEventListener("ended", () => {
      feedback.textContent = correct ? form.dataset.success : form.dataset.retry;
      feedback.dataset.result = correct ? "correct" : "retry";
      takeaway.hidden = false;
      completed.add(lesson.id);
      try { localStorage.setItem(storageKey, JSON.stringify([...completed])); } catch {}
      updateProgress();
    });
  }

  progress.hidden = false;
  updateProgress();
  show(location.hash.slice(1));
})();
