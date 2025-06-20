// Ouvre le pop-up et affiche les détails
function openSlide(ev) {
  console.log("openSlide called"); // ← Vérifie dans la console
  const card = ev.currentTarget.closest('.event');
  const overlay = document.getElementById('event-overlay');
  const content = document.getElementById('event-modal-content');
  const modal = document.getElementById('event-modal');

  // Cloner la carte entière
  const clone = card.cloneNode(true);

  // Récupère la catégorie
  const cat = card.dataset.category;

  // Supprime les anciennes classes de catégorie sur overlay et modal
  overlay.className = 'event-overlay show';
  modal.className = '';
  modal.id = 'event-modal';
  if (cat) {
    overlay.classList.add(cat);
    modal.classList.add(cat);
  }

  // Affiche le détail dans la pop-up
  const longText = clone.querySelector('.event-long');
  if (longText) longText.style.display = 'block';

  const image = clone.querySelector('.event-image');
  if (image) image.style.display = 'block';

  const reserve = clone.querySelector('.reserve-btn');
  if (reserve) reserve.style.display = 'inline-block';

  // Supprimer le bouton "Plus d'infos" dans la pop-up
  const moreBtn = clone.querySelector(".more-button");
  if (moreBtn) moreBtn.remove();

  // Afficher dans la pop-up
  content.innerHTML = '';
  content.appendChild(clone);

  // Afficher l’overlay et bloquer le scroll
  overlay.classList.add("show");
  document.body.classList.add("no-scroll");
}

// Ferme le pop-up
function closeSlide() {
  const overlay = document.getElementById("event-overlay");
  overlay.classList.remove("show");

  // Réactiver le scroll du body
  document.body.classList.remove("no-scroll");
}

// Fermer la slide en cliquant à l'extérieur du modal
document.getElementById("event-overlay").addEventListener("click", function (e) {
  const modal = document.getElementById("event-modal");
  if (!modal.contains(e.target)) {
    closeSlide();
  }
});

// Clique sur l'image dans la slide => agrandissement
document.addEventListener("click", function (e) {
  const img = e.target;

  // Si l'image est dans la slide
  if (img.classList.contains("event-image")) {
    const fullscreenImg = document.createElement("img");
    fullscreenImg.src = img.src;
    fullscreenImg.classList.add("fullscreen-image");

    // Clique pour fermer l'image en plein écran
    fullscreenImg.addEventListener("click", function () {
      fullscreenImg.remove();
    });

    document.body.appendChild(fullscreenImg);
  }
});

// Fonction utilitaires pour rendre les dates
function formatToISO(ddmmyyyy, hhmm) {
  const [d, m, y] = ddmmyyyy.split('/');
  return `${y}-${m}-${d}T${hhmm || '00:00'}`;
}
function formatDate(ddmmyyyy, hhmm) {
  const [d, m, y] = ddmmyyyy.split('/');
  const date = new Date(`${y}-${m}-${d}T${hhmm || '00:00'}`);
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    + (hhmm ? ' — ' + hhmm : '');
}
function formatHeure(hhmm) {
  const [h, mn] = hhmm.split(':');
  return `${parseInt(h)}h${mn !== '00' ? mn : ''}`;
}

// Détermine si l'événement est passé
function isPast(event) {
  const now = new Date();
  const ed = new Date(event.dataset.date);
  return ed < now;
}

// Filtre les événements par catégorie
function filterEvents(cats, ev) {
  document.querySelectorAll('.event').forEach(e => {
    e.style.display = (!isPast(e) && (cats.includes('all') || cats.includes(e.dataset.category)))
      ? 'block' : 'none';
  });
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (ev) ev.target.classList.add('active');
}

// Ouvre la fenêtre "Plus d'infos"
function openSlide(ev) {
  const card = ev.currentTarget.closest('.event');
  const overlay = document.getElementById('event-overlay');
  const content = document.getElementById('event-modal-content');

  const clone = card.cloneNode(true);

  // Affiche le détail dans la pop-up
  const moreText = clone.querySelector('.more-text');
  if (moreText) moreText.style.display = 'inline';
  const moreDots = clone.querySelector('.more-dots');
  if (moreDots) moreDots.style.display = 'none';
  const moreBtn = clone.querySelector('.more-button');
  if (moreBtn) moreBtn.remove();

  content.innerHTML = '';
  content.appendChild(clone);
  overlay.style.display = 'block';
}
function closeSlide() {
  document.getElementById('event-overlay').style.display = 'none';
}

// Chargement des données CSV
Papa.parse('agenda-culturel-site-internet.csv', {
  download: true,
  header: true,
  delimiter: ';',
  skipEmptyLines: true,
  complete: results => {
    const tpl = document.getElementById('event-template');
    const container = document.querySelector('.container');

    results.data.forEach(evt => {
      if (!evt.date || !evt.titre) return;

      const n = tpl.content.cloneNode(true);
      const card = n.querySelector('.event');

      const cat = (evt.category || '').toLowerCase().trim();

      // ID/ancre
      if (evt.ancre) {
        card.id = evt.ancre;
      }

      // Applique la catégorie
      card.dataset.category = cat;
      card.classList.add(cat);

      const tag = card.querySelector('.event-tag');
      if (tag) tag.classList.add(cat);

      const iso = formatToISO(evt.date, evt.heure);
      card.dataset.date = iso;

      // Remplissage des champs
      const elDate = card.querySelector('.event-date');
      if (elDate) elDate.textContent = formatDate(evt.date, evt.heure);

      const elTitle = card.querySelector('.event-title');
      if (elTitle) elTitle.textContent = evt.titre || '';

      const elShort = card.querySelector('.event-short');
      if (elShort) elShort.textContent = evt.description_courte || '';

      const elLong = card.querySelector('.event-long');
      if (elLong) elLong.innerHTML = evt.description_longue || '';

      const elLieu = card.querySelector('.event-lieu');
      if (elLieu) elLieu.innerHTML = evt.lieu || '';

      const elLieuDetail = card.querySelector('.event-lieu-detail');
      if (elLieuDetail) elLieuDetail.innerHTML = evt.lieu_detail || '';

      const elPrix = card.querySelector('.event-prix');
      if (elPrix) elPrix.innerHTML = evt.prix || '';

      const elContact = card.querySelector('.event-contact');
      if (elContact) elContact.innerHTML = evt.contact || '';

      const elContactTel = card.querySelector('.event-contact-tel');
      if (elContactTel) elContactTel.innerHTML = evt.contact_tel || '';

      const elContactUrl = card.querySelector('.event-contact-url');
      if (elContactUrl) elContactUrl.innerHTML = evt.contact_url || '';

      const elDuration = card.querySelector('.event-duration');
      if (elDuration) elDuration.innerHTML = evt.duree || '';

      const elInfo = card.querySelector('.event-information');
      if (elInfo) elInfo.innerHTML = evt.information || '';

      // Description longue
      if (evt.description_longue) {
        const el = card.querySelector('.event-long');
        el.innerHTML = evt.description_longue;
        el.style.display = "block";
      }

      // Lieu détail
      if (evt.lieu_detail) {
        const el = card.querySelector('.event-lieu-detail');
        el.innerHTML = evt.lieu_detail;
        el.style.display = "inline";
      }

      // Durée
      if (evt.duree) {
        card.querySelector('.event-duration').innerHTML = evt.duree;
        card.querySelector('.event-duration').style.display = "inline";
      }

      // Information
      if (evt.information) {
        const el = card.querySelector('.event-information');
        el.innerHTML = evt.information;
        el.style.display = "inline";
      }

      if (evt.image) {
        const img = card.querySelector('.event-image');
        img.src = evt.image;
        img.style.display = 'block';
      }

      // Affiche un bouton réservation si la case réservation est renseignée (par défaut bouton est caché)
      if (evt.reservation && evt.reservation.toLowerCase() === "oui") {
        const reserveBtn = card.querySelector('.reserve-btn');
        if (reserveBtn) {
          reserveBtn.href = `/reserve/${evt.ancre}`;
          reserveBtn.style.display = 'inline-block';
        }
      }
      container.appendChild(n);

      // Applique l'affichage "plus d'infos" au bouton
      const moreBtn = card.querySelector('.more-button');
      if (moreBtn) {
        moreBtn.addEventListener('click', openSlide);
      }
    });

    filterEvents(['all']);

    // Scroll automatique vers l'ancre APRÈS création des événements
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.substring(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});