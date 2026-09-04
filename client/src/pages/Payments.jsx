import { useEffect, useMemo, useState } from "react";

import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock3,
  IndianRupee,
  Search,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { getTransactions } from "../services/paymentApi";

function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  //LOAD TRANSACTIONS
  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getTransactions();

      if (result.success) {
        setTransactions(result.data || []);
      } else {
        setError(
          "Failed to load payment transactions"
        );
      }
    } catch (err) {
      console.error("Payments loading error:", err);
      setError("Unable to load payment transactions");
    } finally {
      setLoading(false);
    }
  };

  //INITIAL LOAD
  useEffect(() => {
    loadTransactions();
  }, []);

  //STATS
  const stats = useMemo(() => {
    const total = transactions.length;

    const successful = transactions.filter(
      (item) => item.status === "success"
    ).length;

    const failed = transactions.filter(
      (item) => item.status === "failed"
    ).length;

    const abandoned = transactions.filter(
      (item) => item.status === "abandoned"
    ).length;

    const totalValue = transactions.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return {
      total,
      successful,
      failed,
      abandoned,
      totalValue,
    };
  }, [transactions]);

  //FILTER TRANSACTIONS
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const customerName =
        transaction.customerId?.name?.toLowerCase() || "";

      const customerEmail =
        transaction.customerId?.email?.toLowerCase() || "";

      const transactionId =
        transaction._id?.toLowerCase() || "";

      const method =
        transaction.paymentMethod?.toLowerCase() || "";

      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        transactionId.includes(query) ||
        method.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        transaction.status === statusFilter;

      const matchesMethod =
        methodFilter === "all" ||
        transaction.paymentMethod === methodFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );
    });
  }, [
    transactions,
    search,
    statusFilter,
    methodFilter,
  ]);

  //FORMATTERS
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMethod = (method) => {
    if (!method) return "Unknown";

    return method
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "success":
        return "payment-status success";

      case "failed":
        return "payment-status failed";

      case "abandoned":
        return "payment-status abandoned";

      case "pending":
        return "payment-status pending";

      default:
        return "payment-status";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle2 size={14} />;

      case "failed":
        return <XCircle size={14} />;

      case "abandoned":
        return <Clock3 size={14} />;

      default:
        return <Clock3 size={14} />;
    }
  };

  const paymentMethods = useMemo(() => {
    const methods = transactions
      .map((item) => item.paymentMethod)
      .filter(Boolean);

    return [...new Set(methods)];
  }, [transactions]);

  const closeTransactionDetails = () => {
    setSelectedTransaction(null);
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="payments-page">
          <div className="payments-header">
            <div>
              <div className="section-eyebrow">
                PAYMENT OPERATIONS
              </div>

              <h1>Payments</h1>

              <p>
                Monitor payment activity across your
                recovery system.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadTransactions}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={loading ? "spin" : ""}
              />
              Refresh
            </button>
          </div>

          <section className="payment-stat-grid">
            <div className="payment-stat-card">
              <div className="stat-icon purple">
                <CreditCard size={20} />
              </div>

              <div>
                <span>Total Payments</span>
                <strong>{stats.total}</strong>
              </div>
            </div>

            <div className="payment-stat-card">
              <div className="stat-icon green">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <span>Successful</span>
                <strong>{stats.successful}</strong>
              </div>
            </div>

            <div className="payment-stat-card">
              <div className="stat-icon red">
                <XCircle size={20} />
              </div>

              <div>
                <span>Failed</span>
                <strong>{stats.failed}</strong>
              </div>
            </div>

            <div className="payment-stat-card">
              <div className="stat-icon orange">
                <Clock3 size={20} />
              </div>

              <div>
                <span>Abandoned</span>
                <strong>{stats.abandoned}</strong>
              </div>
            </div>

            <div className="payment-stat-card">
              <div className="stat-icon violet">
                <IndianRupee size={20} />
              </div>

              <div>
                <span>Transaction Value</span>

                <strong>
                  {formatCurrency(stats.totalValue)}
                </strong>
              </div>
            </div>
          </section>

          <section className="payments-panel">
            <div className="payments-toolbar">
              <div className="payment-search">
                <Search size={18} />

                <input
                  type="text"
                  placeholder="Search customer, transaction ID or method..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>

              <div className="payment-filters">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option value="all">
                    All Status
                  </option>

                  <option value="success">
                    Successful
                  </option>

                  <option value="failed">
                    Failed
                  </option>

                  <option value="abandoned">
                    Abandoned
                  </option>

                  <option value="pending">
                    Pending
                  </option>
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) =>
                    setMethodFilter(e.target.value)
                  }
                >
                  <option value="all">
                    All Methods
                  </option>

                  {paymentMethods.map((method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {formatMethod(method)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="payments-table-header">
              <div>
                <h2>Payment Transactions</h2>

                <span>
                  {filteredTransactions.length}{" "}
                  transactions matching current
                  filters
                </span>
              </div>

              <div className="live-indicator">
                <span></span>
                Live data
              </div>
            </div>

            {loading ? (
              <div className="payments-state">
                <RefreshCw
                  size={25}
                  className="spin"
                />

                <p>
                  Loading payment transactions...
                </p>
              </div>
            ) : error ? (
              <div className="payments-state error-state">
                <XCircle size={28} />

                <p>{error}</p>

                <button
                  onClick={loadTransactions}
                  className="retry-button"
                >
                  Try Again
                </button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="payments-state">
                <CreditCard size={30} />

                <p>
                  No payment transactions found.
                </p>
              </div>
            ) : (
              <div className="payments-table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>TRANSACTION</th>
                      <th>CUSTOMER</th>
                      <th>AMOUNT</th>
                      <th>METHOD</th>
                      <th>STATUS</th>
                      <th>FAILURE REASON</th>
                      <th>DATE</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map(
                      (transaction) => (
                        <tr key={transaction._id}>
                          <td>
                            <div className="transaction-cell">
                              <div className="transaction-icon">
                                <CreditCard size={16} />
                              </div>

                              <div>
                                <strong>
                                  {transaction._id
                                    ?.slice(-8)
                                    .toUpperCase()}
                                </strong>

                                <span>
                                  {transaction.currency ||
                                    "INR"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="customer-cell">
                              <strong>
                                {transaction.customerId
                                  ?.name ||
                                  "Unknown Customer"}
                              </strong>

                              <span>
                                {transaction.customerId
                                  ?.email || "—"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <strong className="amount">
                              {formatCurrency(
                                transaction.amount
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="method-badge">
                              {formatMethod(
                                transaction.paymentMethod
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                transaction.status
                              )}
                            >
                              {getStatusIcon(
                                transaction.status
                              )}

                              {transaction.status}
                            </span>
                          </td>

                          <td>
                            <span className="failure-reason">
                              {transaction.failureReason ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            <span className="date-cell">
                              {formatDate(
                                transaction.createdAt
                              )}
                            </span>
                          </td>

                          <td>
                            <button
                              className="row-action"
                              onClick={() =>
                                setSelectedTransaction(
                                  transaction
                                )
                              }
                              title="View payment details"
                            >
                              <ChevronRight size={17} />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {selectedTransaction && (
        <div
          className="payment-details-overlay"
          onClick={closeTransactionDetails}
        >
          <div
            className="payment-details-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-details-header">
              <div>
                <span className="section-eyebrow">
                  PAYMENT DETAILS
                </span>

                <h2>Transaction Details</h2>

                <p>
                  Complete information for this payment.
                </p>
              </div>

              <button
                className="payment-details-close"
                onClick={closeTransactionDetails}
              >
                ×
              </button>
            </div>

            <div className="payment-details-status">
              <div className="transaction-icon">
                <CreditCard size={18} />
              </div>

              <div>
                <span>Transaction ID</span>

                <strong>
                  {selectedTransaction._id}
                </strong>
              </div>
            </div>

            <div className="payment-details-amount">
              <span>Transaction Amount</span>

              <strong>
                {formatCurrency(
                  selectedTransaction.amount
                )}
              </strong>
            </div>

            <div className="payment-details-grid">
              <div className="payment-detail-item">
                <span>Customer</span>

                <strong>
                  {selectedTransaction.customerId
                    ?.name ||
                    "Unknown Customer"}
                </strong>
              </div>

              <div className="payment-detail-item">
                <span>Email</span>

                <strong>
                  {selectedTransaction.customerId
                    ?.email || "—"}
                </strong>
              </div>

              <div className="payment-detail-item">
                <span>Payment Method</span>

                <strong>
                  {formatMethod(
                    selectedTransaction.paymentMethod
                  )}
                </strong>
              </div>

              <div className="payment-detail-item">
                <span>Status</span>

                <span
                  className={getStatusClass(
                    selectedTransaction.status
                  )}
                >
                  {getStatusIcon(
                    selectedTransaction.status
                  )}

                  {selectedTransaction.status}
                </span>
              </div>

              <div className="payment-detail-item">
                <span>Currency</span>

                <strong>
                  {selectedTransaction.currency ||
                    "INR"}
                </strong>
              </div>

              <div className="payment-detail-item">
                <span>Date</span>

                <strong>
                  {formatDate(
                    selectedTransaction.createdAt
                  )}
                </strong>
              </div>
            </div>

            <div className="payment-detail-reason">
              <span>Failure Reason</span>

              <p>
                {selectedTransaction.failureReason ||
                  "No failure reason recorded."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;