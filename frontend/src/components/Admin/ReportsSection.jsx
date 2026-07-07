import { useEffect, useState } from 'react';
import { getDailyReport, getShiftsReport } from '../../api';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function ReportsSection() {
  const [date, setDate] = useState(getToday());
  const [daily, setDaily] = useState(null);
  const [shiftsReport, setShiftsReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    Promise.all([getDailyReport(date), getShiftsReport(date)])
      .then(([dailyData, shiftsData]) => {
        setDaily(dailyData);
        setShiftsReport(shiftsData);
      })
      .catch((err) => setError(err.message));
  }, [date]);

  return (
    <div className="menu-section">
      <div className="menu-section-header">
        <h1>Звіти</h1>
        <input
          type="date"
          className="date-picker"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && <div className="admin-error">{error}</div>}

      {daily && (
        <div className="report-cards">
          <div className="report-card">
            <span className="report-card-label">Виручка</span>
            <span className="report-card-value">{Number(daily.total_revenue).toFixed(2)} ₴</span>
          </div>
          <div className="report-card">
            <span className="report-card-label">Замовлень</span>
            <span className="report-card-value">{daily.orders_count}</span>
          </div>
          <div className="report-card">
            <span className="report-card-label">Готівка</span>
            <span className="report-card-value">{Number(daily.cash_total).toFixed(2)} ₴</span>
          </div>
          <div className="report-card">
            <span className="report-card-label">Картка</span>
            <span className="report-card-value">{Number(daily.card_total).toFixed(2)} ₴</span>
          </div>
        </div>
      )}

      <h2 className="report-subtitle">Топ товарів</h2>
      <table className="menu-table">
        <thead>
          <tr>
            <th>Товар</th>
            <th>Продано, шт</th>
          </tr>
        </thead>
        <tbody>
          {daily?.top_products.map((product) => (
            <tr key={product.product_id}>
              <td>{product.name}</td>
              <td>{product.quantity_sold}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {daily && daily.top_products.length === 0 && (
        <div className="menu-empty">Немає продажів за цю дату</div>
      )}

      <h2 className="report-subtitle">Зміни</h2>
      <table className="menu-table">
        <thead>
          <tr>
            <th>Касир</th>
            <th>Замовлень</th>
            <th>Готівка</th>
            <th>Картка</th>
            <th>Разом</th>
          </tr>
        </thead>
        <tbody>
          {shiftsReport?.shifts.map((shift) => (
            <tr key={shift.shift_id}>
              <td>{shift.cashier.name}</td>
              <td>{shift.orders_count}</td>
              <td>{Number(shift.cash_total).toFixed(2)} ₴</td>
              <td>{Number(shift.card_total).toFixed(2)} ₴</td>
              <td>{Number(shift.total_sales).toFixed(2)} ₴</td>
            </tr>
          ))}
        </tbody>
      </table>
      {shiftsReport && shiftsReport.shifts.length === 0 && (
        <div className="menu-empty">Змін за цю дату немає</div>
      )}
    </div>
  );
}

export default ReportsSection;
