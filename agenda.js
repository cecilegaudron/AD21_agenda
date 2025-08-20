document.addEventListener('click', function (e) {
  if (e.target.classList.contains('ag_more-button')) {
    const card = e.target.closest('.ag_event');
    const isExpanded = card.classList.contains('expanded');
    // Ferme tous les autres
    document.querySelectorAll('.ag_event.expanded').forEach(ev => {
      if (ev !== card) {
        ev.classList.remove('expanded');
        // Remet tous les boutons à "Plus d'infos"
        ev.querySelectorAll('.ag_more-button').forEach(btn => btn.textContent = 'Plus d\'infos');
        ev.querySelectorAll('.ag_more-button-bottom').forEach(btn => btn.textContent = 'Moins d\'infos');
      }
    });
    // Toggle l'état de celui-ci
    card.classList.toggle('expanded', !isExpanded);
    // Met à jour le texte des deux boutons du bloc courant
    card.querySelectorAll('.ag_more-button').forEach(btn => btn.textContent = isExpanded ? 'Plus d\'infos' : 'Moins d\'infos');
    card.querySelectorAll('.ag_more-button-bottom').forEach(btn => btn.textContent = isExpanded ? 'Moins d\'infos' : 'Moins d\'infos');
    // Optionnel : scroll vers l'event ouvert
    if (!isExpanded) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  let jour = date.toLocaleDateString('fr-FR', { weekday: 'long' });
  let num = parseInt(d);
  let numAff = (num === 1) ? '1<sup>er</sup>' : num;
  let moisAnnee = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  let heure = hhmm ? ' à ' + formatHeure(hhmm) : '';
  return `${jour} ${numAff} ${moisAnnee}${heure}`;
}
function formatHeure(hhmm) {
  const [h, mn] = hhmm.split(':');
  return `${parseInt(h)}h${mn !== '00' ? mn : ''}`;
}

// Détermine si l'événement est passé
function isPast(event) {
  const now = new Date();

  // Récupère les dates depuis les data-attributes
  const date = event.dataset.date;
  const heure = event.dataset.heure || "00:00";
  const dateDebut = event.dataset.dateDebut;
  const dateFin = event.dataset.dateFin;

  // Helper pour vérifier une date valide
  function isValidDateParts(d, m, y) {
    return d && m && y && d.length === 2 && m.length === 2 && y.length === 4 && d !== "nan" && m !== "nan" && y !== "nan";
  }

  // Si date simple
  if (date) {
    const [d, m, y] = date.split('/');
    const iso = `${y}-${m}-${d}T${heure}`;
    const ed = new Date(iso);
    return ed < now;
  }

  // Si période (date_fin prioritaire)
  if (dateFin) {
    const [d, m, y] = dateFin.split('/');
    if (isValidDateParts(d, m, y)) {
      const iso = `${y}-${m}-${d}T23:59`;
      const ed = new Date(iso);
      return ed < now;
    }
    return false;
  }

  // Si seulement date_debut
  if (dateDebut) {
    const [d, m, y] = dateDebut.split('/');
    if (isValidDateParts(d, m, y)) {
      const iso = `${y}-${m}-${d}T00:00`;
      const ed = new Date(iso);
      return ed < now;
    }
    return false;
  }

  // Si aucune date, on considère non passé
  return false;
}

// Filtre les événements par catégorie
function filterEvents(cats, ev) {
  let visibleCount = 0;
  document.querySelectorAll('.ag_event').forEach(e => {
    const show = (!isPast(e) && (cats.includes('all') || cats.includes(e.dataset.category)));
    e.style.display = show ? 'block' : 'none';
    if (show) visibleCount++;
  });
  document.querySelectorAll('.ag_filter-btn').forEach(b => b.classList.remove('active'));
  if (ev) ev.target.classList.add('active');

  // Affiche ou masque le message "aucun événement"
  const msg = document.getElementById('ag_no-events-message');
  if (msg) msg.style.display = (visibleCount === 0) ? 'block' : 'none';
}

// Chargement des données CSV
Papa.parse('agenda_site.csv', {
  download: true,
  header: true,
  delimiter: ';',
  skipEmptyLines: true,
  complete: results => {
    const tpl = document.getElementById('ag_event-template');
    const container = document.querySelector('.ag_container');

    // Trie les événements par date croissante (date ou date_debut)
    results.data.sort((a, b) => {
      // Utilise date si présente, sinon date_debut
      const getDateISO = evt => {
        if (evt.date && evt.date.trim()) return formatToISO(evt.date, evt.heure);
        if (evt.date_debut && evt.date_debut.trim()) return formatToISO(evt.date_debut, evt.heure);
        return ""; // Pour les événements sans date
      };
      // Convertit les dates au format ISO pour comparaison
      const dateA = getDateISO(a);
      const dateB = getDateISO(b);
      return dateA.localeCompare(dateB);
    });

    results.data.forEach(evt => {
      if (!evt.titre) return;

      const n = tpl.firstElementChild.cloneNode(true);
      const card = n;

      const cat = (evt.category || '').toLowerCase().trim();

      // ID/ancre
      if (evt.id) {
        card.id = evt.id;
      }

      // Applique la catégorie
      card.dataset.category = 'ag_' + cat;
      card.classList.add('ag_' + cat);

      const tag = card.querySelector('.ag_event-tag');
      if (tag) tag.classList.add('ag_' + cat);

      // Gestion de la date
      let dateAffichee = "";
      // Ajout des data-attributes pour le filtrage des dates
      if (evt.date) {
        card.dataset.date = evt.date;
        if (evt.heure) card.dataset.heure = evt.heure;
      }
      if (evt.date_debut) card.dataset.dateDebut = evt.date_debut;
      if (evt.date_fin) card.dataset.dateFin = evt.date_fin;
      // Détermine la date à afficher (date simple / période)
      if (evt.date) {
        dateAffichee = formatDate(evt.date, evt.heure);
      } else if (evt.date_debut && evt.date_fin) {
        const [d1, m1, y1] = evt.date_debut.split('/');
        const [d2, m2, y2] = evt.date_fin.split('/');
        if (m1 === m2 && y1 === y2) {
          // Même mois et année : tout sur une seule ligne
          const moisAnnee = new Date(`${y1}-${m1}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          dateAffichee = `Du ${parseInt(d1)} au ${parseInt(d2)} ${moisAnnee}`;
        } else {
          // Mois ou année différents : deux lignes
          dateAffichee = `Du ${formatDate(evt.date_debut)}<br>au ${formatDate(evt.date_fin)}`;
        }
      } else if (evt.date_debut) {
        dateAffichee = `Dès le ${formatDate(evt.date_debut)}`;
      } else if (evt.date_fin) {
        dateAffichee = `Jusqu'au ${formatDate(evt.date_fin)}`;
      }

      const elDate = card.querySelector('.ag_event-date');
      if (elDate) elDate.innerHTML = dateAffichee;

      // Remplissage des autres champs
      const elTitle = card.querySelector('.ag_event-title');
      if (elTitle) elTitle.textContent = evt.titre || '';

      const elShort = card.querySelector('.ag_event-short');
      if (elShort) elShort.innerHTML = evt.description_courte || '';

      const elLieuDetail = card.querySelector('.ag_event-lieu-detail');
      if (elLieuDetail) elLieuDetail.innerHTML = evt.lieu_detail || '';

      // Description longue
      if (evt.description_longue) {
        const el = card.querySelector('.ag_event-long');
        el.innerHTML = evt.description_longue;
        el.style.display = "block";
      }

      // Durée
      const elDuree = card.querySelector('.ag_event-duration');
      if (elDuree && evt.duree) {
        elDuree.innerHTML = '<i>Durée : </i>' + formatHeure(evt.duree);
        elDuree.style.display = "block";
      } else if (elDuree) elDuree.style.display = "none";

      // Informations complémentaires
      const elInfo = card.querySelector('.ag_event-information');
      if (elInfo && evt.information) {
        elInfo.innerHTML = '<i>Informations complémentaires : </i>' + evt.information;
        elInfo.style.display = "block";
      } else if (elInfo) elInfo.style.display = "none";

      // LIEU
      // Résumé du lieu sous le bouton "Plus d'infos" (quand plié)
      const elLieuResume = card.querySelector('.ag_lieu_resume');
      if (elLieuResume) {
        if (evt.lieu_detail && evt.lieu_detail.trim() !== "") {
          elLieuResume.innerHTML = `<strong>Lieu de l\'événement : ${evt.lieu_detail}</strong>`;
          elLieuResume.style.display = "block";
        } else {
          elLieuResume.style.display = "none";
        }
      }

      // Lieu dans les détails (bloc déplié)
      const elLieu = card.querySelector('.ag_event-lieu');
      if (elLieu) {
        if (evt.lieu_detail && evt.lieu_detail.trim() !== "") {
          elLieu.innerHTML = `<i>Lieu de l'événement : </i>${evt.lieu_detail}`;
          elLieu.style.display = "block";
        } else if (
          evt.lieu &&
          evt.lieu.trim() === "Lieu extérieur aux Archives" &&
          evt.lieu_exterieur &&
          evt.lieu_exterieur.trim() !== ""
        ) {
          elLieu.innerHTML = `<i>Lieu de l'événement : </i>${evt.lieu_exterieur}`;
          elLieu.style.display = "block";
        } else if (evt.lieu) {
          elLieu.innerHTML = `<i>Lieu de l'événement : </i>${evt.lieu}`;
          elLieu.style.display = "block";
        } else {
          elLieu.style.display = "none";
        }
      }

      // Prix
      const elPrix = card.querySelector('.ag_event-prix');
      if (elPrix && evt.prix) {
        elPrix.innerHTML = '<i>Prix : </i>' + evt.prix;
        elPrix.style.display = "block";
      } else if (elPrix) elPrix.style.display = "none";

      // Contact
      const elContact = card.querySelector('.ag_event-contact');
      const contactParts = [];
      if (evt.contact) contactParts.push(evt.contact);
      if (evt.contact_tel) contactParts.push(evt.contact_tel);
      if (evt.contact_url) {
        contactParts.push('<a href="' + evt.contact_url + '" target="_blank" rel="noopener">site internet</a>');
      }
      if (elContact && contactParts.length > 0) {
        elContact.innerHTML = '<i>Contact : </i>' + contactParts.join(' - ');
        elContact.style.display = "block";
      } else if (elContact) elContact.style.display = "none";

      // Image
      if (evt.image && evt.image.trim() !== "") {
        const img = card.querySelector('.ag_event-image');
        img.src = evt.image;
        img.style.display = "block";
        img.alt = "Affiche de l'événement";
        img.title = "Visualiser l'affiche";

        // Image link
        if (!img.parentElement.classList.contains('ag_event-image-link')) {
          const link = document.createElement('a');
          link.href = evt.image;
          link.target = "_blank";
          link.rel = "noopener";
          link.className = "ag_event-image-link";
          img.parentNode.insertBefore(link, img);
          link.appendChild(img);
        }
      }

      // Application URL Réservation dans bouton réservation
      if (evt.reservation && evt.reservation.toLowerCase() === "oui" && evt.reservation_url && evt.reservation_url.trim()) {
        const reserveBtn = card.querySelector('.ag_reserve-btn');
        if (reserveBtn) {
          reserveBtn.style.display = 'inline-block';
          reserveBtn.dataset.url = evt.reservation_url;
        }
      } else {
        const reserveBtn = card.querySelector('.ag_reserve-btn');
        if (reserveBtn) {
          reserveBtn.style.display = 'none';
          reserveBtn.removeAttribute('data-url');
        }
      }

      container.appendChild(n);
    });

    filterEvents(['all']);

    // Scroll automatique vers l'ancre APRÈS création des événements
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.substring(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

});

// Gestion du bouton de réservation (div)
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('ag_reserve-btn')) {
    const url = e.target.dataset.url;
    if (url) window.open(url, '_blank', 'noopener');
  }
});
document.addEventListener('keydown', function (e) {
  if (
    e.target.classList.contains('ag_reserve-btn') &&
    (e.key === 'Enter' || e.key === ' ')
  ) {
    e.preventDefault();
    const url = e.target.dataset.url;
    if (url) window.open(url, '_blank', 'noopener');
  }
});

// Ouvre l'affiche dans un nouvel onglet au clic
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('ag_event-image')) {
    const src = e.target.src;
    if (src) window.open(src, '_blank', 'noopener');
  }
});