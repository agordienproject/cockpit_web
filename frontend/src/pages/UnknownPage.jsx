import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const UnknownContent = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',textAlign:'center',padding:'2rem'}}>
      <div style={{fontSize:96,lineHeight:1}}>🤖</div>
      <h1 style={{fontSize:32,marginTop:8}}>Uh-oh — Unknown Page</h1>
      <p style={{maxWidth:600}}>Looks like the address you typed doesn't point to any page in this cockpit. Maybe the gremlins moved it?</p>
      <div style={{marginTop:20,display:'flex',gap:12}}>
        {isAuthenticated ? (
          <Link to="/dashboard" style={{padding:'10px 16px',background:'#2563eb',color:'#fff',borderRadius:6,textDecoration:'none'}}>Go to Dashboard</Link>
        ) : (
          <Link to="/login" style={{padding:'10px 16px',background:'#10b981',color:'#fff',borderRadius:6,textDecoration:'none'}}>Sign In</Link>
        )}
        <a href="/" style={{padding:'10px 16px',background:'#ef4444',color:'#fff',borderRadius:6,textDecoration:'none'}}>Reload App</a>
      </div>
      <small style={{display:'block',marginTop:18,color:'#6b7280'}}>Tip: If you followed a stale bookmark, try the Dashboard or re-login.</small>
    </div>
  );
}

const UnknownPage = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  // If authenticated, render inside Layout so nav/sidebar remains visible
  if (isAuthenticated) {
    return (
      <Layout>
        <UnknownContent />
      </Layout>
    );
  }

  return <UnknownContent />;
}

export default UnknownPage;
