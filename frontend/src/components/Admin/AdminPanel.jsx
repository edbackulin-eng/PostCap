import { useState } from 'react';
import MenuSection from './MenuSection';
import './AdminPanel.css';

const SECTIONS = ['Меню', 'Склад', 'Звіти', 'Працівники', 'Підписка'];

function AdminPanel({ user }) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);

  return (
    <div className="admin-screen">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">PostCup</div>
        <div className="admin-sidebar-owner">{user.name}</div>
        <nav className="admin-nav">
          {SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              className={`admin-nav-item ${
                section === activeSection ? 'admin-nav-item--active' : ''
              }`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-content">
        {activeSection === 'Меню' ? (
          <MenuSection />
        ) : (
          <div className="admin-placeholder">Розділ «{activeSection}» ще в розробці</div>
        )}
      </main>
    </div>
  );
}

export default AdminPanel;
