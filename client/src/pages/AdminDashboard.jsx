import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast, useAuth } from '../App.jsx';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [halls, setHalls] = useState([]);
  const [reports, setReports] = useState({ sales: null, occupancy: null, popularity: null });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'movie', 'session', lub 'hall'
  const [editingItem, setEditingItem] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Formularz dla filmów, seansów i sal
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    poster: '',
    movie_id: '',
    datetime: '',
    price: '',
    hall_id: '',
    format: '2D',
    name: '',
    capacity: ''
  });

  // Załaduj wszystkie dane na początku (dla kafelków statystyk)
  useEffect(() => {
    if (user && user.role === 'admin') {
      // Załaduj wszystkie dane równolegle dla kafelków
      Promise.all([
        api.get('/admin/movies').catch(() => ({ data: [] })),
        api.get('/admin/sessions').catch(() => ({ data: [] })),
        api.get('/admin/tickets').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/halls').catch(() => ({ data: [] })),
        api.get('/admin/orders').catch(() => ({ data: [] }))
      ]).then(([moviesRes, sessionsRes, ticketsRes, usersRes, hallsRes, ordersRes]) => {
        setMovies(moviesRes.data || []);
        setSessions(sessionsRes.data || []);
        setTickets(ticketsRes.data || []);
        setUsers(usersRes.data || []);
        setHalls(hallsRes.data || []);
        setOrders(ordersRes.data || []);
      });
    }
  }, [user]);

  // Załaduj dane dla aktywnej zakładki (z obsługą race condition)
  useEffect(() => {
    // Zamykaj modal przy zmianie zakładki (NAJPIERW!)
    setShowModal(false);
    setEditingItem(null);
    setModalType('');
    
    if (user && user.role === 'admin') {
      // AbortController do anulowania poprzednich requestów
      const abortController = new AbortController();
      
      loadData(activeTab, abortController.signal);
      
      // Cleanup - anuluj requesty przy zmianie zakładki
      return () => {
        abortController.abort();
      };
    }
  }, [activeTab, user]);

  const loadData = async (tab, signal = null) => {
    // Nie pokazuj loading dla raportów (żeby nie było ciemno)
    if (tab !== 'reports') {
      setLoading(true);
    }
    try {
      // Sprawdź czy request został anulowany
      if (signal?.aborted) return;
      switch (tab) {
        case 'movies':
          const moviesRes = await api.get('/admin/movies');
          setMovies(moviesRes.data);
          break;
        case 'sessions':
          const sessionsRes = await api.get('/admin/sessions');
          setSessions(sessionsRes.data);
          break;
        case 'users':
          const usersRes = await api.get('/admin/users');
          setUsers(usersRes.data);
          break;
        case 'orders':
          const ordersRes = await api.get('/admin/orders');
          setOrders(ordersRes.data);
          break;
        case 'tickets':
          const ticketsRes = await api.get('/admin/tickets');
          setTickets(ticketsRes.data);
          break;
        case 'halls':
          const hallsRes = await api.get('/admin/halls');
          setHalls(hallsRes.data);
          break;
        case 'reports':
          // Dla raportów ładuj dane bez loading state
          if (signal?.aborted) return;
          try {
            const [salesRes, occupancyRes, popularityRes] = await Promise.all([
              api.get('/reports/sales').catch(() => ({ data: null })),
              api.get('/reports/occupancy').catch(() => ({ data: [] })),
              api.get('/reports/popularity').catch(() => ({ data: [] }))
            ]);
            if (!signal?.aborted) {
              setReports({
                sales: salesRes.data,
                occupancy: occupancyRes.data || [],
                popularity: popularityRes.data || []
              });
            }
          } catch (err) {
            console.error('Reports error:', err);
            if (!signal?.aborted) {
              setReports({
                sales: null,
                occupancy: [],
                popularity: []
              });
            }
          }
          return; // Wyjdź wcześniej, żeby nie ustawić loading
      }
    } catch (error) {
      showToast('error', 'Błąd ładowania danych');
    } finally {
      if (tab !== 'reports') {
        setLoading(false);
      }
    }
  };

  const deleteItem = async (endpoint, id, name) => {
    if (!confirm(`Czy na pewno chcesz usunąć ${name}?`)) return;

    try {
      await api.delete(`/admin/${endpoint}/${id}`);
      showToast('success', 'Usunięto pomyślnie');
      loadData(activeTab);
    } catch (error) {
      showToast('error', 'Błąd podczas usuwania');
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      showToast('success', 'Rola zaktualizowana');
      loadData('users');
    } catch (error) {
      showToast('error', 'Błąd podczas zmiany roli');
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (item) {
      // Edycja - wypełnij formularz danymi
      if (type === 'movie') {
        setFormData({
          title: item.title || '',
          description: item.description || '',
          duration: item.duration || '',
          poster: item.poster || '',
          movie_id: '',
          datetime: '',
          price: ''
        });
      } else if (type === 'session') {
        setFormData({
          title: '',
          description: '',
          duration: '',
          poster: '',
        movie_id: item.movie_id || '',
        datetime: item.datetime ? (() => {
          try {
            const date = new Date(item.datetime);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().slice(0, 16);
          } catch {
            return '';
          }
        })() : '',
        price: item.price ? String(item.price).replace(',', '.') : '',
        hall_id: item.hall_id || '',
        format: item.format || '2D'
        });
      } else if (type === 'hall') {
        setFormData({
          title: '',
          description: '',
          duration: '',
          poster: '',
          movie_id: '',
          datetime: '',
          price: '',
          hall_id: '',
          name: item.name || '',
          capacity: item.capacity || ''
        });
      }
    } else {
      // Dodawanie - pusty formularz
      setFormData({
        title: '',
        description: '',
        duration: '',
        poster: '',
        movie_id: '',
        datetime: '',
        price: '',
        hall_id: '',
        name: '',
        capacity: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setModalType('');
      // Reset form data
    setFormData({
      title: '',
      description: '',
      duration: '',
      poster: '',
      movie_id: '',
      datetime: '',
      price: '',
      hall_id: '',
      format: '2D',
      name: '',
      capacity: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalType === 'movie') {
        if (editingItem) {
          // Edycja filmu
          await api.put(`/admin/movies/${editingItem.id}`, {
            title: formData.title,
            description: formData.description,
            duration: parseInt(formData.duration),
            poster: formData.poster
          });
          showToast('success', 'Film zaktualizowany');
        } else {
          // Dodanie filmu
          await api.post('/admin/movies', {
            title: formData.title,
            description: formData.description,
            duration: parseInt(formData.duration),
            poster: formData.poster
          });
          showToast('success', 'Film dodany');
        }
        loadData('movies');
      } else if (modalType === 'session') {
        if (editingItem) {
          // Edycja seansu
          // Walidacja hall_id - sprawdź czy to poprawna liczba
          const hallId = formData.hall_id && formData.hall_id.trim() !== '' 
            ? parseInt(formData.hall_id) 
            : null;
          
          if (hallId !== null && isNaN(hallId)) {
            showToast('error', 'Nieprawidłowy ID sali');
            return;
          }
          
          // Walidacja daty
          if (!formData.datetime || formData.datetime.trim() === '') {
            showToast('error', 'Data i godzina są wymagane');
            return;
          }
          
          // Konwersja daty z formatu datetime-local (YYYY-MM-DDTHH:mm) na MySQL (YYYY-MM-DD HH:mm:ss)
          let datetimeValue = formData.datetime.replace('T', ' ') + ':00';
          
          // Walidacja formatu przed wysłaniem
          const formatValue = (formData.format === '2D' || formData.format === '3D') 
            ? formData.format 
            : '2D';
          
          // Walidacja ceny - bardziej szczegółowa
          if (!formData.price || formData.price.toString().trim() === '') {
            showToast('error', 'Cena jest wymagana');
            return;
          }
          
          const priceStr = String(formData.price).trim().replace(/[^\d.,]/g, '').replace(',', '.');
          const priceValue = parseFloat(priceStr);
          
          console.log('[FRONTEND] Price validation:', { 
            original: formData.price, 
            cleaned: priceStr, 
            parsed: priceValue,
            isValid: !isNaN(priceValue) && priceValue > 0
          });
          
          if (isNaN(priceValue) || priceValue <= 0) {
            showToast('error', `Nieprawidłowa cena: "${formData.price}". Wprowadź poprawną liczbę większą od 0.`);
            return;
          }
          
          try {
            console.log('[FRONTEND] Sending update request:', {
              movie_id: parseInt(formData.movie_id),
              datetime: datetimeValue,
              price: priceValue,
              hall_id: hallId,
              format: formatValue
            });
            
            await api.put(`/admin/sessions/${editingItem.id}`, {
              movie_id: parseInt(formData.movie_id),
              datetime: datetimeValue,
              price: priceValue,
              hall_id: hallId,
              format: formatValue
            });
            
            showToast('success', 'Seans zaktualizowany');
            loadData('sessions');
            closeModal();
          } catch (error) {
            console.error('[FRONTEND] Update error:', error);
            console.error('[FRONTEND] Error response:', error?.response?.data);
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Błąd aktualizacji seansu';
            if (errorMsg.includes('format') || errorMsg.includes('ER_BAD_FIELD_ERROR')) {
              showToast('error', 'Błąd: Kolumna format nie istnieje w bazie. Wykonaj migrację SQL: mysql -u root -p cinema < server/sql/add_format_to_sessions.sql');
            } else {
              showToast('error', `Błąd: ${errorMsg}`);
            }
            return;
          }
        } else {
          // Walidacja hall_id - sprawdź czy to poprawna liczba
          const hallId = formData.hall_id && formData.hall_id.trim() !== '' 
            ? parseInt(formData.hall_id) 
            : null;
          
          if (hallId !== null && isNaN(hallId)) {
            showToast('error', 'Nieprawidłowy ID sali');
            return;
          }
          
          // Dodanie seansu
          // Walidacja daty
          if (!formData.datetime || formData.datetime.trim() === '') {
            showToast('error', 'Data i godzina są wymagane');
            return;
          }
          
          // Konwersja daty z formatu datetime-local (YYYY-MM-DDTHH:mm) na MySQL (YYYY-MM-DD HH:mm:ss)
          let datetimeValue = formData.datetime.replace('T', ' ') + ':00';
          
          // Walidacja formatu przed wysłaniem
          const formatValue = (formData.format === '2D' || formData.format === '3D') 
            ? formData.format 
            : '2D';
          
          // Walidacja ceny - bardziej szczegółowa
          if (!formData.price || formData.price.toString().trim() === '') {
            showToast('error', 'Cena jest wymagana');
            return;
          }
          
          const priceStr = String(formData.price).trim().replace(/[^\d.,]/g, '').replace(',', '.');
          const priceValue = parseFloat(priceStr);
          
          if (isNaN(priceValue) || priceValue <= 0) {
            showToast('error', `Nieprawidłowa cena: "${formData.price}". Wprowadź poprawną liczbę większą od 0.`);
            return;
          }
          
          try {
            await api.post('/admin/sessions', {
              movie_id: parseInt(formData.movie_id),
              datetime: datetimeValue,
              price: priceValue,
              hall_id: hallId,
              format: formatValue
            });
            showToast('success', 'Seans dodany');
            loadData('sessions');
            closeModal();
          } catch (error) {
            console.error('[FRONTEND] Add error:', error);
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Błąd dodawania seansu';
            if (errorMsg.includes('format') || errorMsg.includes('ER_BAD_FIELD_ERROR')) {
              showToast('error', 'Błąd: Kolumna format nie istnieje w bazie. Wykonaj migrację SQL: mysql -u root -p cinema < server/sql/add_format_to_sessions.sql');
            } else {
              showToast('error', `Błąd: ${errorMsg}`);
            }
            return;
          }
        }
        loadData('sessions');
      } else if (modalType === 'hall') {
        if (editingItem) {
          // Edycja sali
          await api.put(`/admin/halls/${editingItem.id}`, {
            name: formData.name,
            capacity: parseInt(formData.capacity),
            description: formData.description
          });
          showToast('success', 'Sala zaktualizowana');
        } else {
          // Dodanie sali
          await api.post('/admin/halls', {
            name: formData.name,
            capacity: parseInt(formData.capacity),
            description: formData.description
          });
          showToast('success', 'Sala dodana');
        }
        loadData('halls');
      }
      closeModal();
    } catch (error) {
      showToast('error', 'Błąd podczas zapisywania');
    }
  };

  // Sprawdź czy użytkownik ma rolę admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="container">
        <h1>🚫 Brak dostępu</h1>
        <p>Masz dostęp tylko dla administratorów.</p>
      </div>
    );
  }

  // Wymuś zamknięcie modala jeśli jesteśmy na raportach
  useEffect(() => {
    if (activeTab === 'reports' && showModal) {
      setShowModal(false);
      setEditingItem(null);
      setModalType('');
    }
  }, [activeTab, showModal]);

  return (
    <div className="container">
      <h1>🔧 Panel Administratora</h1>
      
      {/* Karty statystyk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '2.5em', color: '#667eea' }}>{movies.length}</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Filmy</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2) 0%, rgba(245, 87, 108, 0.2) 100%)', border: '1px solid rgba(240, 147, 251, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '2.5em', color: '#f093fb' }}>{sessions.length}</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Seanse</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)', border: '1px solid rgba(79, 172, 254, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '2.5em', color: '#4facfe' }}>{tickets.length}</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Bilety</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.2) 0%, rgba(56, 249, 215, 0.2) 100%)', border: '1px solid rgba(67, 233, 123, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '2.5em', color: '#43e97b' }}>{users.length}</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Użytkownicy</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2) 0%, rgba(250, 204, 21, 0.1) 100%)', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '2.5em', color: 'var(--primary)' }}>{halls.length}</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Sale</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 159, 64, 0.2) 100%)', border: '1px solid rgba(255, 107, 107, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '2.5em', color: '#ff6b6b' }}>{orders.length}</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>Zamówienia</p>
        </div>
      </div>

      <div className="admin-tabs">
        {['movies', 'sessions', 'halls', 'users', 'orders', 'tickets', 'reports'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? '' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'movies' && '🎬 Filmy'}
            {tab === 'sessions' && '📅 Seanse'}
            {tab === 'halls' && '🎭 Sale'}
            {tab === 'users' && '👥 Użytkownicy'}
            {tab === 'orders' && '🛒 Zamówienia'}
            {tab === 'tickets' && '🎫 Bilety'}
            {tab === 'reports' && '📊 Raporty'}
          </button>
        ))}
      </div>

      {loading && activeTab !== 'reports' && <div className="loading">Ładowanie...</div>}

      {/* FILMY */}
      {activeTab === 'movies' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>🎬 Zarządzanie filmami</h2>
            <button className="btn" onClick={() => openModal('movie')}>
              + Dodaj film
            </button>
          </div>
          <div className="grid">
            {movies.map(movie => (
              <div key={movie.id} className="card">
                <h3>{movie.title}</h3>
                <p>{movie.description}</p>
                <p>Czas: {movie.duration} min</p>
                <div className="card-actions">
                  <button className="btn btn-ghost" onClick={() => openModal('movie', movie)}>
                    Edytuj
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => deleteItem('movies', movie.id, movie.title)}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEANSE */}
      {activeTab === 'sessions' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>📅 Zarządzanie seansami</h2>
            <button className="btn" onClick={() => openModal('session')}>
              + Dodaj seans
            </button>
          </div>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Film</th>
                  <th>Data i czas</th>
                  <th>Sala</th>
                  <th>Cena</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id}>
                    <td>{session.movie_title}</td>
                    <td>{new Date(session.datetime).toLocaleString('pl-PL')}</td>
                    <td>{session.hall_name || 'Brak sali'}</td>
                    <td>{session.price} zł</td>
                    <td>
                      <button className="btn btn-ghost" onClick={() => openModal('session', session)}>
                        Edytuj
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => deleteItem('sessions', session.id, 'seans')}
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UŻYTKOWNICY */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <h2>👥 Zarządzanie użytkownikami</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Email</th>
                  <th>Rola</th>
                  <th>Data rejestracji</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {users.map(userItem => (
                  <tr key={userItem.id}>
                    <td>{userItem.name}</td>
                    <td>{userItem.email}</td>
                    <td>
                      <select
                        value={userItem.role}
                        onChange={(e) => changeUserRole(userItem.id, e.target.value)}
                      >
                        <option value="user">Użytkownik</option>
                        <option value="employee">Pracownik</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td>{new Date(userItem.created_at).toLocaleDateString('pl-PL')}</td>
                   <td>
  <button 
    className="btn-danger"
    onClick={() => deleteItem('users', userItem.id, userItem.name)}
  >
    Usuń
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ZAMÓWIENIA */}
      {activeTab === 'orders' && (
        <div className="admin-section">
          <h2>🛒 Wszystkie zamówienia</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Użytkownik</th>
                  <th>Produkty</th>
                  <th>Suma</th>
                  <th>Data</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.user_name}</td>
                    <td>
                      {order.items.map(item => `${item.qty}×${item.name}`).join(', ')}
                    </td>
                    <td>{order.total} zł</td>
                    <td>{new Date(order.created_at).toLocaleString('pl-PL')}</td>
                    <td>{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SALE KINOWE */}
      {activeTab === 'halls' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>🎭 Zarządzanie salami kinowymi</h2>
            <button className="btn" onClick={() => openModal('hall')}>
              + Dodaj salę
            </button>
          </div>
          <div className="grid">
            {halls.map(hall => (
              <div key={hall.id} className="card">
                <h3>{hall.name}</h3>
                <p>Pojemność: {hall.capacity} miejsc</p>
                {hall.description && <p>{hall.description}</p>}
                <div className="card-actions">
                  <button className="btn btn-ghost" onClick={() => openModal('hall', hall)}>
                    Edytuj
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => deleteItem('halls', hall.id, hall.name)}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BILETY */}
      {activeTab === 'tickets' && (
        <div className="admin-section">
          <h2>🎫 Wszystkie bilety</h2>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Film</th>
                  <th>Użytkownik</th>
                  <th>Miejsca</th>
                  <th>Cena</th>
                  <th>Data seansu</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>#{ticket.id}</td>
                    <td>{ticket.movie_title}</td>
                    <td>{ticket.user_name}</td>
                    <td>{ticket.seats}</td>
                    <td>{ticket.price} zł</td>
                    <td>{new Date(ticket.datetime).toLocaleString('pl-PL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RAPORTY - NOWA WERSJA */}
      {activeTab === 'reports' && (
        <div className="admin-section">
          <h2>📊 Raporty</h2>
          
          {/* Raport sprzedaży */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>💰 Raport sprzedaży</h3>
            {reports.sales && reports.sales.summary ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {reports.sales.summary.total_tickets || 0}
                    </div>
                    <div style={{ opacity: 0.8 }}>Sprzedane bilety</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {parseFloat(reports.sales.summary.total_revenue || 0).toFixed(2)} zł
                    </div>
                    <div style={{ opacity: 0.8 }}>Całkowity przychód</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {reports.sales.summary.total_customers || 0}
                    </div>
                    <div style={{ opacity: 0.8 }}>Unikalni klienci</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {parseFloat(reports.sales.summary.avg_ticket_price || 0).toFixed(2)} zł
                    </div>
                    <div style={{ opacity: 0.8 }}>Średnia cena biletu</div>
                  </div>
                </div>
                {reports.sales.daily && reports.sales.daily.length > 0 && (
                  <div className="table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Bilety</th>
                          <th>Przychód</th>
                          <th>Klienci</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.sales.daily.slice(0, 10).map((day, idx) => (
                          <tr key={idx}>
                            <td>{new Date(day.date).toLocaleDateString('pl-PL')}</td>
                            <td>{day.tickets_sold || 0}</td>
                            <td>{parseFloat(day.total_revenue || 0).toFixed(2)} zł</td>
                            <td>{day.unique_customers || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p style={{ opacity: 0.7 }}>Ładowanie danych sprzedaży...</p>
            )}
          </div>

          {/* Raport obłożenia sal */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>🎭 Obłożenie sal</h3>
            {reports.occupancy && reports.occupancy.length > 0 ? (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Sala</th>
                      <th>Pojemność</th>
                      <th>Seanse</th>
                      <th>Bilety</th>
                      <th>Przychód</th>
                      <th>Obłożenie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.occupancy.map((hall, idx) => (
                      <tr key={idx}>
                        <td>{hall.hall_name || 'Brak sali'}</td>
                        <td>{hall.capacity || 0}</td>
                        <td>{hall.total_sessions || 0}</td>
                        <td>{hall.tickets_sold || 0}</td>
                        <td>{parseFloat(hall.revenue || 0).toFixed(2)} zł</td>
                        <td>{parseFloat(hall.occupancy_rate || 0).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ opacity: 0.7 }}>Ładowanie danych obłożenia...</p>
            )}
          </div>

          {/* Raport popularności filmów */}
          <div className="card">
            <h3>🎬 Popularność filmów</h3>
            {reports.popularity && reports.popularity.length > 0 ? (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Film</th>
                      <th>Seanse</th>
                      <th>Bilety</th>
                      <th>Przychód</th>
                      <th>Średnia cena</th>
                      <th>Widzowie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.popularity.map((movie, idx) => (
                      <tr key={idx}>
                        <td>{movie.title || 'Brak tytułu'}</td>
                        <td>{movie.sessions_count || 0}</td>
                        <td>{movie.tickets_sold || 0}</td>
                        <td>{parseFloat(movie.revenue || 0).toFixed(2)} zł</td>
                        <td>{parseFloat(movie.avg_price || 0).toFixed(2)} zł</td>
                        <td>{movie.unique_viewers || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ opacity: 0.7 }}>Ładowanie danych popularności...</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL DLA FORMULARZY - NIE renderuj na raportach */}
      {showModal && activeTab !== 'reports' && modalType !== '' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingItem ? 'Edytuj' : 'Dodaj'} {
                  modalType === 'movie' ? 'film' : 
                  modalType === 'session' ? 'seans' : 
                  modalType === 'hall' ? 'salę' : ''
                }
              </h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {modalType === 'movie' && (
                <>
                  <div className="form-group">
                    <label>Tytuł filmu:</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Opis:</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Czas trwania (min):</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Plakat (URL):</label>
                    <input
                      type="url"
                      value={formData.poster}
                      onChange={(e) => setFormData({...formData, poster: e.target.value})}
                    />
                  </div>
                </>
              )}

              {modalType === 'session' && (
                <>
                  <div className="form-group">
                    <label>Film:</label>
                    <select
                      value={formData.movie_id}
                      onChange={(e) => setFormData({...formData, movie_id: e.target.value})}
                      required
                    >
                      <option value="">Wybierz film</option>
                      {movies.map(movie => (
                        <option key={movie.id} value={movie.id}>{movie.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sala kinowa:</label>
                    <select
                      value={formData.hall_id}
                      onChange={(e) => setFormData({...formData, hall_id: e.target.value})}
                    >
                      <option value="">Brak sali</option>
                      {halls.map(hall => (
                        <option key={hall.id} value={hall.id}>{hall.name} ({hall.capacity} miejsc)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Data i czas:</label>
                    <input
                      type="datetime-local"
                      value={formData.datetime}
                      onChange={(e) => setFormData({...formData, datetime: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cena (zł):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Format:</label>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData({...formData, format: e.target.value})}
                      required
                    >
                      <option value="2D">2D</option>
                      <option value="3D">3D</option>
                    </select>
                  </div>
                </>
              )}

              {modalType === 'hall' && (
                <>
                  <div className="form-group">
                    <label>Nazwa sali:</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Pojemność (liczba miejsc):</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Opis:</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Anuluj
                </button>
                <button type="submit" className="btn">
                  {editingItem ? 'Zapisz' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}