import { useEffect, useMemo, useState } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Search,
  RefreshCw,
  ChevronRight,
  UserRound,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const API_BASE_URL = "http://localhost:5000/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  //LOAD CUSTOMERS
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/customers`);

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const result = await response.json();

      if (result.success) {
        setCustomers(result.data || []);
      } else {
        setError("Failed to load customers");
      }
    } catch (err) {
      console.error("Customers loading error:", err);
      setError("Unable to load customer data");
    } finally {
      setLoading(false);
    }
  };

  //INITIAL LOAD
  useEffect(() => {
    loadCustomers();
  }, []);

  //STATS
  const stats = useMemo(() => {
    const totalCustomers = customers.length;

    const successfulPayments = customers.reduce(
      (sum, customer) =>
        sum + Number(customer.totalSuccessfulPayments || 0),
      0
    );

    const failedPayments = customers.reduce(
      (sum, customer) =>
        sum + Number(customer.totalFailedPayments || 0),
      0
    );

    const lifetimeValue = customers.reduce(
      (sum, customer) => sum + Number(customer.lifetimeValue || 0),
      0
    );

    return {
      totalCustomers,
      successfulPayments,
      failedPayments,
      lifetimeValue,
    };
  }, [customers]);

  //FILTER CUSTOMERS
  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return customers;

    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const email = customer.email?.toLowerCase() || "";
      const phone = customer.phone?.toLowerCase() || "";

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [customers, search]);

  //FORMATTERS
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="customers-page">
          {/* HEADER */}
          <div className="customers-header">
            <div>
              <div className="section-eyebrow">CUSTOMER OPERATIONS</div>

              <h1>Customers</h1>

              <p>
                Monitor customer payment activity and lifetime revenue.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadCustomers}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={loading ? "spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* STATS */}
          <section className="customer-stat-grid">
            <div className="customer-stat-card">
              <div className="stat-icon purple">
                <Users size={20} />
              </div>

              <div>
                <span>Total Customers</span>
                <strong>{stats.totalCustomers}</strong>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className="stat-icon green">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <span>Successful Payments</span>
                <strong>{stats.successfulPayments}</strong>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className="stat-icon red">
                <XCircle size={20} />
              </div>

              <div>
                <span>Failed Payments</span>
                <strong>{stats.failedPayments}</strong>
              </div>
            </div>

            <div className="customer-stat-card">
              <div className="stat-icon violet">
                <IndianRupee size={20} />
              </div>

              <div>
                <span>Customer Lifetime Value</span>
                <strong>
                  {formatCurrency(stats.lifetimeValue)}
                </strong>
              </div>
            </div>
          </section>

          {/* CUSTOMER PANEL */}
          <section className="customers-panel">
            <div className="customers-toolbar">
              <div className="customer-search">
                <Search size={18} />

                <input
                  type="text"
                  placeholder="Search customer name, email or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="customers-table-header">
              <div>
                <h2>Customer Directory</h2>

                <span>
                  {filteredCustomers.length} customers matching current
                  search
                </span>
              </div>

              <div className="live-indicator">
                <span></span>
                Live data
              </div>
            </div>

            {/* STATES */}
            {loading ? (
              <div className="customers-state">
                <RefreshCw size={25} className="spin" />

                <p>Loading customers...</p>
              </div>
            ) : error ? (
              <div className="customers-state error-state">
                <XCircle size={28} />

                <p>{error}</p>

                <button
                  onClick={loadCustomers}
                  className="retry-button"
                >
                  Try Again
                </button>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="customers-state">
                <Users size={30} />

                <p>No customers found.</p>
              </div>
            ) : (
              <div className="customers-table-wrapper">
                <table className="customers-table">
                  <thead>
                    <tr>
                      <th>CUSTOMER</th>
                      <th>CONTACT</th>
                      <th>SUCCESSFUL</th>
                      <th>FAILED</th>
                      <th>LIFETIME VALUE</th>
                      <th>JOINED</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer._id}>
                        <td>
                          <div className="customer-profile-cell">
                            <div className="customer-avatar">
                              {customer.name
                                ?.charAt(0)
                                ?.toUpperCase() || "C"}
                            </div>

                            <div>
                              <strong>
                                {customer.name || "Unknown Customer"}
                              </strong>

                              <span>
                                ID: {customer._id?.slice(-8).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="customer-contact-cell">
                            <strong>
                              {customer.email || "—"}
                            </strong>

                            <span>
                              {customer.phone || "No phone number"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="customer-success-value">
                            <CheckCircle2 size={14} />
                            {customer.totalSuccessfulPayments || 0}
                          </span>
                        </td>

                        <td>
                          <span className="customer-failed-value">
                            <XCircle size={14} />
                            {customer.totalFailedPayments || 0}
                          </span>
                        </td>

                        <td>
                          <strong className="customer-lifetime-value">
                            {formatCurrency(customer.lifetimeValue)}
                          </strong>
                        </td>

                        <td>
                          <span className="customer-date">
                            {formatDate(customer.createdAt)}
                          </span>
                        </td>

                        <td>
                          <button
                            className="row-action"
                            title="View customer details"
                            onClick={() =>
                              setSelectedCustomer(customer)
                            }
                          >
                            <ChevronRight size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* CUSTOMER DETAILS DRAWER */}
      {selectedCustomer && (
        <div
          className="customer-drawer-overlay"
          onClick={() => setSelectedCustomer(null)}
        >
          <aside
            className="customer-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="customer-drawer-header">
              <div>
                <span className="section-eyebrow">
                  CUSTOMER PROFILE
                </span>

                <h2>Customer Details</h2>
              </div>

              <button
                className="drawer-close"
                onClick={() => setSelectedCustomer(null)}
              >
                ×
              </button>
            </div>

            <div className="customer-profile-large">
              <div className="customer-avatar large">
                {selectedCustomer.name
                  ?.charAt(0)
                  ?.toUpperCase() || "C"}
              </div>

              <div>
                <h3>
                  {selectedCustomer.name || "Unknown Customer"}
                </h3>

                <p>{selectedCustomer.email || "—"}</p>
              </div>
            </div>

            <div className="customer-detail-grid">
              <div className="customer-detail-card">
                <span>Successful Payments</span>

                <strong>
                  {selectedCustomer.totalSuccessfulPayments || 0}
                </strong>
              </div>

              <div className="customer-detail-card">
                <span>Failed Payments</span>

                <strong>
                  {selectedCustomer.totalFailedPayments || 0}
                </strong>
              </div>

              <div className="customer-detail-card full">
                <span>Lifetime Value</span>

                <strong>
                  {formatCurrency(selectedCustomer.lifetimeValue)}
                </strong>
              </div>
            </div>

            <div className="customer-info-section">
              <h4>Contact Information</h4>

              <div className="customer-info-row">
                <span>Email</span>
                <strong>{selectedCustomer.email || "—"}</strong>
              </div>

              <div className="customer-info-row">
                <span>Phone</span>
                <strong>{selectedCustomer.phone || "—"}</strong>
              </div>

              <div className="customer-info-row">
                <span>Customer Since</span>
                <strong>
                  {formatDate(selectedCustomer.createdAt)}
                </strong>
              </div>
            </div>

            <div className="customer-status-box">
              <UserRound size={18} />

              <div>
                <strong>Customer active</strong>

                <span>
                  Payment activity is tracked by Recovery AI.
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Customers;