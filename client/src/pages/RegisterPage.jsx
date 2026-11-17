import React from 'react';
import { Navigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import AuthSplitLayout from '../components/auth/AuthSplitLayout';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthSplitLayout
      mode="register"
      title="Create Account"
      subtitle="Start saving your ideas securely in Inkwell"
    >
      <RegisterForm />
    </AuthSplitLayout>
  );
};

export default RegisterPage;
