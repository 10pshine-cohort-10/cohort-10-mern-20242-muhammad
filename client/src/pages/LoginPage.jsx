import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const stateMessage = location.state?.message;

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthSplitLayout
      mode="login"
      title="Welcome Back"
      subtitle="Sign in to access your Inkwell workspace"
      bannerMessage={stateMessage}
    >
      <LoginForm />
    </AuthSplitLayout>
  );
};

export default LoginPage;
