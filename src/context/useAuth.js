import { useContext } from 'react';
import { AuthContextValue } from './AuthContextValue';

export const useAuth = () => useContext(AuthContextValue);
