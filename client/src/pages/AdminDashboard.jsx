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
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'movie' lub 'session'
  const [editingItem, setEditingItem] = useState(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Formularz dla filmów i seansów
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    poster: '',
    movie_id: '',
    datetime: '',
    price: ''
  });

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData(activeTab);
    }
  }, [activeTab, user]);

  const loadData = async (tab) => {
    setLoading(true);
    try {
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
      }
    } catch (error) {
      showToast('error', 'Błąd ładowania danych');
    } finally {
      setLoading(false);
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
          datetime: item.datetime ? new Date(item.datetime).toISOString().slice(0, 16) : '',
          price: item.price || ''
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
        price: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setModalType('');
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
          await api.put(`/admin/sessions/${editingItem.id}`, {
            movie_id: parseInt(formData.movie_id),
            datetime: formData.datetime,
            price: parseFloat(formData.price)
          });
          showToast('success', 'Seans zaktualizowany');
        } else {
          // Dodanie seansu
          await api.post('/admin/sessions', {
            movie_id: parseInt(formData.movie_id),
            datetime: formData.datetime,
            price: parseFloat(formData.price)
          });
          showToast('success', 'Seans dodany');
        }
        loadData('sessions');
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

  return (
    <div className="container">
      
      <h1>🔧 Panel Administratora</h1>

      <div className="admin-tabs">
        {['movies', 'sessions', 'users', 'orders', 'tickets'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? '' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'movies' && '🎬 Filmy'}
            {tab === 'sessions' && '📅 Seanse'}
            {tab === 'users' && '👥 Użytkownicy'}
            {tab === 'orders' && '🛒 Zamówienia'}
            {tab === 'tickets' && '🎫 Bilety'}
          </button>
        ))}
      </div>

      {loading && <div className="loading">Ładowanie...</div>}

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
                  <th>Cena</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id}>
                    <td>{session.movie_title}</td>
                    <td>{new Date(session.datetime).toLocaleString('pl-PL')}</td>
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

      {/* MODAL DLA FORMULARZY */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingItem ? 'Edytuj' : 'Dodaj'} {modalType === 'movie' ? 'film' : 'seans'}
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