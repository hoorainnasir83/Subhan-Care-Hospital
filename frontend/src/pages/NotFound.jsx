import React from 'react';
import ErrorPage from './ErrorPage';

const NotFound = ({ onGoHome }) => {
  return <ErrorPage code={404} onGoHome={onGoHome} fullScreen />;
};

export default NotFound;