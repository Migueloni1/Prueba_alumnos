import React, { StrictMode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const AppContext = createContext(null);

const icons = {
  grid: '▦', users: '♧', heart: '♡', heartFill: '♥', search: '⌕', plus: '+',
  arrow: '→', close: '×', star: '★', location: '⌖', calendar: '◷', mail: '✉',
  phone: '◉', instagram: '◎', check: '✓', menu: '☰', spark: '✦'
};

function useApp() {
  return useContext(AppContext);
}

function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('emprendimientos');
  const [favorites, setFavorites] = useState([]);
  const [liked, setLiked] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [reviews, setReviews] = useState({});
  const [likes, setLikes] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const response = await fetch('/data/data.json');
        if (!response.ok) throw new Error('No se pudo cargar el catálogo');
        const json = await response.json();
        setData(json);
        setFavorites(json.estudianteActual.favoritosEmprendimientosIds);
        setLiked(json.estudianteActual.likesEmprendimientosIds);
        setJoinedGroups(json.estudianteActual.gruposInscritosIds);
        setLikes(Object.fromEntries(json.emprendimientos.map(item => [item.id, item.likes])));
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message, type = 'success') => setToast({ message, type });
  const toggleFavorite = id => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const toggleLike = id => {
    setLiked(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setLikes(current => ({ ...current, [id]: current[id] + (liked.includes(id) ? -1 : 1) }));
  };
  const addReview = (id, review) => setReviews(current => ({ ...current, [id]: [...(current[id] || []), review] }));
  const joinGroup = id => {
    setJoinedGroups(current => [...current, id]);
    notify('¡Solicitud enviada! La coordinación revisará tu inscripción.');
  };

  const value = { data, error, activeView, setActiveView, favorites, liked, joinedGroups, reviews, likes, toggleFavorite, toggleLike, addReview, joinGroup, notify, toast };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function App() {
  return <DataProvider><Shell /></DataProvider>;
}

function Shell() {
  const { data, error, activeView, setActiveView, toast } = useApp();
  const [mobileMenu, setMobileMenu] = useState(false);
  if (error) return <main className="center-state"><div className="empty-icon">!</div><h2>No pudimos cargar Red Campus</h2><p>{error}. Revisa que el archivo de datos esté disponible.</p></main>;
  if (!data) return <Loading />;

  const navigate = view => { setActiveView(view); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => navigate('emprendimientos')}><span className="brand-mark">{icons.spark}</span><span>red<span className="brand-accent">campus</span></span></button>
          <nav className={mobileMenu ? 'main-nav open' : 'main-nav'}>
            <button className={activeView === 'emprendimientos' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('emprendimientos')}><span>{icons.grid}</span>Emprendimientos</button>
            <button className={activeView === 'grupos' ? 'nav-link active' : 'nav-link'} onClick={() => navigate('grupos')}><span>{icons.users}</span>Grupos intermedios</button>
          </nav>
          <div className="profile"><div className="avatar">CR</div><div className="profile-copy"><strong>{data.estudianteActual.nombre}</strong><span>{data.estudianteActual.carrera}</span></div><button className="profile-chevron">⌄</button></div>
          <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menú">{icons.menu}</button>
        </div>
      </header>
      <main>
        {activeView === 'emprendimientos' ? <EntrepreneurView /> : <GroupsView />}
      </main>
      {toast && <div className={`toast ${toast.type}`}><span className="toast-check">{icons.check}</span>{toast.message}</div>}
      <footer><span>{icons.spark} Red Campus</span><span>Hecho para conectar a nuestra comunidad universitaria</span></footer>
    </div>
  );
}

function Loading() {
  return <main className="center-state"><div className="loading-orbit"></div><h2>Cargando Red Campus</h2><p>Estamos preparando tu comunidad universitaria.</p></main>;
}

function EntrepreneurView() {
  const { data, favorites, liked, reviews, likes } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [campus, setCampus] = useState('Todos');
  const [tab, setTab] = useState('explorar');
  const [selected, setSelected] = useState(null);
  const categories = [...new Set(data.emprendimientos.map(item => item.clasificacion))];
  const filtered = useMemo(() => data.emprendimientos.filter(item => {
    const text = `${item.nombre} ${item.descripcion}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'Todas' || item.clasificacion === category;
    const matchesCampus = campus === 'Todos' || item.campus_ids.includes(campus);
    return text && matchesCategory && matchesCampus && (tab === 'explorar' || favorites.includes(item.id));
  }), [data, query, category, campus, tab, favorites]);
  return (
    <>
      <section className="hero hero-entrepreneurs">
        <div className="hero-content"><span className="eyebrow">COMUNIDAD QUE SE MUEVE</span><h1>Descubre lo que<br /><em>crea nuestra gente.</em></h1><p>Apoya, conecta y sé parte de las ideas que nacen dentro de la universidad.</p><div className="hero-stats"><div><strong>{data.emprendimientos.length}</strong><span>emprendimientos</span></div><div><strong>{data.grupos_intermedios.length}</strong><span>grupos activos</span></div><div><strong>{data.campus.length}</strong><span>campus</span></div></div></div>
        <div className="hero-art"><div className="art-circle circle-one"></div><div className="art-circle circle-two"></div><div className="art-card"><span>idea del día</span><strong>Tu próximo<br /><i>favorito</i><br />está aquí.</strong><span className="art-arrow">{icons.arrow}</span></div></div>
      </section>
      <section className="content-section">
        <div className="section-heading"><div><span className="section-kicker">EXPLORA Y APOYA</span><h2>Emprendimientos</h2></div><p className="section-intro">Conoce proyectos nacidos de la creatividad y el talento estudiantil.</p></div>
        <div className="filter-bar"><div className="search-wrap"><span>{icons.search}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca por nombre o descripción..." /></div><select value={category} onChange={e => setCategory(e.target.value)}><option value="Todas">Todas las categorías</option>{categories.map(item => <option key={item}>{item}</option>)}</select><select value={campus} onChange={e => setCampus(e.target.value)}><option value="Todos">Todos los campus</option>{data.campus.map(item => <option key={item.id} value={item.id}>{item.nombre.replace('Campus ', '')}</option>)}</select></div>
        <div className="tabs"><button className={tab === 'explorar' ? 'tab active' : 'tab'} onClick={() => setTab('explorar')}>Todos <b>{data.emprendimientos.length}</b></button><button className={tab === 'favoritos' ? 'tab active' : 'tab'} onClick={() => setTab('favoritos')}>{icons.heartFill} Mis favoritos <b>{favorites.length}</b></button></div>
        <div className="result-line"><span>{filtered.length} resultados</span><span className="result-hint">Actualizado recientemente <i>{icons.spark}</i></span></div>
        {filtered.length ? <div className="card-grid">{filtered.map(item => <EntrepreneurCard key={item.id} item={item} liked={liked.includes(item.id)} favorite={favorites.includes(item.id)} likeCount={likes[item.id]} reviewCount={(item.valoraciones?.length || 0) + (reviews[item.id]?.length || 0)} onOpen={() => setSelected(item)} />)}</div> : <EmptyState title={tab === 'favoritos' ? 'Aún no tienes favoritos' : 'No encontramos resultados'} text={tab === 'favoritos' ? 'Guarda emprendimientos para verlos rápidamente aquí.' : 'Prueba con otra búsqueda o ajusta los filtros.'} />}
      </section>
      {selected && <EntrepreneurModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function EntrepreneurCard({ item, liked, favorite, likeCount, reviewCount, onOpen }) {
  const { toggleLike, toggleFavorite, data } = useApp();
  const campusName = data.campus.find(campus => item.campus_ids.includes(campus.id))?.nombre.replace('Campus ', '');
  return <article className="business-card"><div className={`card-cover cover-${(Number(item.id.split('_')[1]) % 6) + 1}`}><span className="cover-label">{item.clasificacion}</span><button className={favorite ? 'favorite active' : 'favorite'} onClick={() => toggleFavorite(item.id)} aria-label="Guardar favorito">{favorite ? icons.heartFill : icons.heart}</button><div className="cover-initials">{item.nombre.split(' ').slice(0, 2).map(word => word[0]).join('')}</div></div><div className="card-body"><div className="card-meta"><span>{icons.location} {campusName}</span><span className="rating">{icons.star} {item.promedio_valoracion.toFixed(1)}</span></div><h3>{item.nombre}</h3><p>{item.descripcion}</p><div className="card-bottom"><span className="review-count">{reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}</span><button className={liked ? 'like-button liked' : 'like-button'} onClick={() => toggleLike(item.id)}>{liked ? icons.heartFill : icons.heart} {likeCount}</button><button className="details-button" onClick={onOpen}>{icons.arrow}</button></div></div></article>;
}

function EntrepreneurModal({ item, onClose }) {
  const { data, reviews, addReview, notify } = useApp();
  const [showReview, setShowReview] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const allReviews = [...(item.valoraciones || []), ...(reviews[item.id] || [])];
  const average = allReviews.length ? allReviews.reduce((sum, review) => sum + review.estrellas, 0) / allReviews.length : 0;
  const contact = item.redes_y_contacto;
  const publish = e => {
    e.preventDefault();
    if (!stars || comment.trim().length < 5) return notify('Selecciona estrellas y escribe al menos 5 caracteres.', 'error');
    addReview(item.id, { id: `new_${Date.now()}`, autor: data.estudianteActual.nombre, estrellas: stars, comentario: comment.trim(), fecha: new Date().toISOString().slice(0, 10) });
    setStars(0); setComment(''); setShowReview(false); notify('¡Gracias! Tu recomendación fue publicada.');
  };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal large-modal" onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={onClose}>{icons.close}</button><div className="modal-cover cover-3"><span>{item.clasificacion}</span><div className="cover-initials">{item.nombre.split(' ').slice(0, 2).map(word => word[0]).join('')}</div></div><div className="modal-content"><div className="modal-title-row"><div><span className="modal-kicker">{icons.location} {data.campus.find(c => item.campus_ids.includes(c.id))?.nombre}</span><h2>{item.nombre}</h2></div><div className="big-rating"><strong>{average.toFixed(1)}</strong><span>{icons.star}</span><small>{allReviews.length} reseñas</small></div></div><p className="modal-description">{item.descripcion}</p><div className="price-tag">{item.valores_referencia}</div><div className="contact-row"><strong>Conecta con este emprendimiento</strong><div className="contact-buttons">{contact.telefono && <a href={`https://wa.me/${contact.telefono.replace('+', '')}`} target="_blank" rel="noreferrer">{icons.phone} WhatsApp</a>}{contact.instagram && <a href={`https://instagram.com/${contact.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">{icons.instagram} Instagram</a>}{contact.correo && <a href={`mailto:${contact.correo}`}>{icons.mail} Correo</a>}</div></div><div className="review-header"><h3>Recomendaciones</h3><button className="secondary-button" onClick={() => setShowReview(!showReview)}>{icons.plus} Escribir reseña</button></div>{showReview && <form className="review-form" onSubmit={publish}><label>Tu valoración <span className="star-picker">{[1, 2, 3, 4, 5].map(star => <button type="button" key={star} className={star <= stars ? 'picked' : ''} onClick={() => setStars(star)}>{icons.star}</button>)}</span></label><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Cuéntale a la comunidad tu experiencia..." maxLength="180" /><button className="primary-button" type="submit">Publicar recomendación</button></form>}{allReviews.length ? <div className="reviews">{allReviews.slice().reverse().map(review => <div className="review" key={review.id}><div className="review-avatar">{review.autor.split(' ').map(word => word[0]).join('').slice(0, 2)}</div><div><div className="review-name"><strong>{review.autor}</strong><span>{review.fecha}</span></div><div className="review-stars">{'★'.repeat(review.estrellas)}<span>{'★'.repeat(5 - review.estrellas)}</span></div><p>{review.comentario}</p></div></div>)}</div> : <p className="muted">Sé la primera persona en recomendar este emprendimiento.</p>}</div></div></div>;
}

function GroupsView() {
  const { data, joinedGroups } = useApp();
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('Todas');
  const [campus, setCampus] = useState('Todos');
  const [tab, setTab] = useState('explorar');
  const [selected, setSelected] = useState(null);
  const themes = [...new Set(data.grupos_intermedios.map(item => item.tematica))];
  const filtered = data.grupos_intermedios.filter(item => `${item.nombre} ${item.descripcion} ${item.tematica}`.toLowerCase().includes(query.toLowerCase()) && (theme === 'Todas' || item.tematica === theme) && (campus === 'Todos' || item.campus_id === campus) && (tab === 'explorar' || joinedGroups.includes(item.id)));
  return <><section className="hero hero-groups"><div className="hero-content"><span className="eyebrow">ENCUENTRA TU TRIBU</span><h1>Hay un lugar<br /><em>para ti.</em></h1><p>Conecta con personas que comparten tus intereses y construye algo en comunidad.</p><div className="hero-actions"><button className="white-button" onClick={() => document.getElementById('group-catalog')?.scrollIntoView({ behavior: 'smooth' })}>Explorar grupos {icons.arrow}</button></div></div><div className="group-art"><div className="person p1">✦</div><div className="person p2">●</div><div className="person p3">✚</div><div className="person p4">◆</div><div className="art-caption">comunidad<br /><strong>en movimiento</strong></div></div></section><section className="content-section" id="group-catalog"><div className="section-heading"><div><span className="section-kicker">PARTICIPA Y CONECTA</span><h2>Grupos intermedios</h2></div><p className="section-intro">Tu próxima experiencia universitaria puede comenzar con una conversación.</p></div><div className="filter-bar"><div className="search-wrap"><span>{icons.search}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca grupos, intereses..." /></div><select value={theme} onChange={e => setTheme(e.target.value)}><option value="Todas">Todas las áreas</option>{themes.map(item => <option key={item}>{item}</option>)}</select><select value={campus} onChange={e => setCampus(e.target.value)}><option value="Todos">Todos los campus</option>{data.campus.map(item => <option key={item.id} value={item.id}>{item.nombre.replace('Campus ', '')}</option>)}</select></div><div className="tabs"><button className={tab === 'explorar' ? 'tab active' : 'tab'} onClick={() => setTab('explorar')}>Explorar <b>{data.grupos_intermedios.length}</b></button><button className={tab === 'mios' ? 'tab active' : 'tab'} onClick={() => setTab('mios')}>{icons.users} Mis grupos <b>{joinedGroups.length}</b></button></div><div className="result-line"><span>{filtered.length} grupos encontrados</span><span className="result-hint">Cupos actualizados <i>{icons.spark}</i></span></div>{filtered.length ? <div className="group-grid">{filtered.map(item => <GroupCard key={item.id} item={item} joined={joinedGroups.includes(item.id)} onOpen={() => setSelected(item)} />)}</div> : <EmptyState title={tab === 'mios' ? 'Todavía no perteneces a grupos' : 'No encontramos grupos'} text="Prueba ajustando los filtros para encontrar nuevas opciones." />}</section>{selected && <GroupModal group={selected} onClose={() => setSelected(null)} />}</>;
}

function GroupCard({ item, joined, onOpen }) {
  const { data } = useApp();
  const campus = data.campus.find(c => c.id === item.campus_id)?.nombre.replace('Campus ', '');
  return <article className="group-card"><div className={`group-color group-color-${Number(item.id.split('_')[1]) % 5}`}><span>{item.tematica}</span><div className="group-symbol">{icons.users}</div></div><div className="group-body"><div className="card-meta"><span>{icons.location} {campus}</span>{joined && <span className="joined-badge">{icons.check} Mi grupo</span>}</div><h3>{item.nombre}</h3><p>{item.descripcion}</p><div className="group-details"><span>{icons.calendar} {item.horario_reunion}</span><span>{icons.users} {item.cupos_disponibles} cupos disponibles</span></div><button className="outline-full-button" onClick={onOpen}>{joined ? 'Ver detalles' : 'Conocer grupo'} {icons.arrow}</button></div></article>;
}

function GroupModal({ group, onClose }) {
  const { data, joinedGroups, joinGroup, notify } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const joined = joinedGroups.includes(group.id);
  const campus = data.campus.find(c => c.id === group.campus_id)?.nombre;
  const sendMessage = e => { e.preventDefault(); if (message.trim().length < 5) return notify('Escribe una consulta de al menos 5 caracteres.', 'error'); setMessage(''); setShowForm(false); notify('Tu consulta fue enviada a la coordinación.'); };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={onClose}>{icons.close}</button><div className={`modal-group-banner group-color-${Number(group.id.split('_')[1]) % 5}`}><span>{group.tematica}</span><div className="group-symbol">{icons.users}</div></div><div className="modal-content"><span className="modal-kicker">{icons.location} {campus}</span><h2>{group.nombre}</h2><p>{group.descripcion}</p><div className="info-list"><div><span>{icons.calendar}</span><strong>Reuniones</strong><p>{group.horario_reunion}</p></div><div><span>{icons.location}</span><strong>Lugar</strong><p>{group.lugar_reunion}</p></div><div><span>{icons.users}</span><strong>Cupos</strong><p>{group.cupos_disponibles} disponibles · {group.cantidad_miembros} integrantes</p></div></div><div className="requirements"><strong>Requisitos para participar</strong><p>{group.requisitos}</p></div>{showForm && <form className="review-form group-form" onSubmit={sendMessage}><label>Consulta para la coordinación</label><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="¿Qué te gustaría saber?" maxLength="220" /><button className="primary-button" type="submit">Enviar consulta</button></form>}<div className="modal-actions"><button className="secondary-button" onClick={() => setShowForm(!showForm)}>{icons.mail} Solicitar información</button>{joined ? <span className="already-joined">{icons.check} Ya eres parte de este grupo</span> : <button className="primary-button" disabled={!group.cupos_disponibles} onClick={() => joinGroup(group.id)}>{group.cupos_disponibles ? 'Inscribirme al grupo' : 'Sin cupos disponibles'} {icons.arrow}</button>}</div></div></div></div>;
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><div className="empty-icon">{icons.search}</div><h3>{title}</h3><p>{text}</p></div>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
