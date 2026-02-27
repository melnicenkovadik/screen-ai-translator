import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, setUserInfo } from './api';

const defaultLocalUser: UserProfile = {
  uid: 'default_user',
  display_name: 'Default User',
  email: 'contact@pickle.com',
};

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'local' | null>(null);

  useEffect(() => {
    setMode('local');
    setUser(defaultLocalUser);
    setUserInfo(defaultLocalUser);
    setIsLoading(false);
  }, []);

  return { user, isLoading, mode };
};

export const useRedirectIfNotAuth = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    void router;
  }, [router]);

  return isLoading ? null : user;
};
