import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 

function HomePage() {
  // 1. Updated state to hold new dashboard data
  const [stats, setStats] = useState(null); // Changed to null
  const [recentLoans, setRecentLoans] = useState([]);
  const [closedLoans, setClosedLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state

  // 2. Fetch all dashboard data when the page loads
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // --- THIS IS THE FIX: Get token and create headers ---
        const token = localStorage.getItem('token');
        if (!token) {
          setError("User not authenticated.");
          setIsLoading(false);
          return;
        }
        const headers = { 'Authorization': `Bearer ${token}` };
        // --- END OF FIX ---

        // We fetch all three data points at the same time for speed
        // Added headers to all requests
        const statsPromise = axios.get('http://localhost:3001/api/dashboard/stats', { headers });
        const recentPromise = axios.get('http://localhost:3001/api/loans/recent/created', { headers });
        const closedPromise = axios.get('http://localhost:3001/api/loans/recent/closed', { headers });

        // Wait for all requests to finish
        const [statsRes, recentRes, closedRes] = await Promise.all([
          statsPromise, 
          recentPromise, 
          closedPromise
        ]);

        setStats(statsRes.data);
        setRecentLoans(recentRes.data);
        setClosedLoans(closedRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // The empty array means this runs once when the page loads

  // 3. Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  
  // We check for stats, as it's the most critical
  if (!stats) return null;

  // 4. Render the new dashboard layout
  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      {/* --- NEW, UPGRADED KPI STAT CARDS --- */}
      <div className="row">
        {/* Total Principal Out */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Principal Out</h6>
              <p className="card-text fs-2 fw-bold">{formatCurrency(stats.totalPrincipalOut)}</p>
            </div>
          </div>
        </div>

        {/* Interest Collected this Month */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">Interest Collected (This Month)</h6>
              <p className="card-text fs-2 fw-bold text-success">{formatCurrency(stats.interestCollectedThisMonth)}</p>
            </div>
          </div>
        </div>
        
        {/* Active Loans */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">Total Active Loans</h6>
              <p className="card-text fs-2 fw-bold">{stats.totalActiveLoans}</p>
            </div>
          </div>
        </div>

        {/* Overdue Loans */}
        <div className="col-md-6 col-lg-3 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="card-title text-danger">Overdue Loans</h6>
              <p className="card-text fs-2 fw-bold text-danger">{stats.totalOverdueLoans}</p>
              {/* This link won't work until we add the "/loans/overdue" route, but it's good to have */}
              {stats.totalOverdueLoans > 0 && (
                <Link to="/overdue" className="btn btn-sm btn-danger">View Overdue</Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* --- END OF NEW STAT CARDS --- */}


      {/* --- RECENT ACTIVITY LISTS (Your existing code) --- */}
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header fw-bold">Recently Created Loans</div>
            <ul className="list-group list-group-flush">
              {recentLoans.length > 0 ? recentLoans.map(loan => (
                <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action">
                  Loan #{loan.id} for <strong>{loan.customer_name}</strong> - {formatCurrency(loan.principal_amount)}
                </Link>
              )) : <li className="list-group-item">No recent loans.</li>}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header fw-bold">Recently Closed Loans</div>
            <ul className="list-group list-group-flush">
              {closedLoans.length > 0 ? closedLoans.map(loan => (
                <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action text-muted">
                  Loan #{loan.id} for <strong>{loan.customer_name}</strong> - {formatCurrency(loan.principal_amount)}
                </Link>
              )) : <li className="list-group-item">No recent loans.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;